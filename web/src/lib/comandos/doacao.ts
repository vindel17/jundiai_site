/**
 * Comandos de doação — regra única para site e WhatsApp.
 *
 * A validação e o tratamento de erro do banco vivem aqui. Quem chama só
 * traduz entrada (FormData ou mensagem) e formata a saída.
 */

import { z } from "zod";
import { CATALOGO, TAMANHOS } from "@/data/catalogo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { certo, errado, type Executor, type Resultado } from "./tipos";

const MODELOS = new Set(CATALOGO.map((item) => item.id));
const TAMANHOS_OK = new Set<string>(TAMANHOS);
const FOTO_MAX = 5 * 1024 * 1024;
const FOTO_TIPOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const anuncioSchema = z.object({
  modelo: z.string().refine((v) => MODELOS.has(v), "Escolha a peça"),
  tamanho: z.string().refine((v) => TAMANHOS_OK.has(v), "Escolha o tamanho"),
  quantidade: z.coerce.number().int().min(1).max(10),
  escola: z.string().trim().min(2, "Informe a escola").max(160),
  estado: z.enum(["bom", "regular"]),
});

const procuroSchema = z.object({
  modelo: z.string().refine((v) => MODELOS.has(v), "Escolha a peça"),
  tamanho: z.string().refine((v) => TAMANHOS_OK.has(v), "Escolha o tamanho"),
});

const uuidSchema = z.string().uuid();

export type FotoEntrada = { conteudo: Blob; tipo: string; tamanho: number };

export type EntradaAnuncio = {
  modelo: unknown;
  tamanho: unknown;
  quantidade: unknown;
  escola: unknown;
  estado: unknown;
  foto: FotoEntrada | null;
};

export type EntradaProcuro = {
  modelo: unknown;
  tamanho: unknown;
  escola?: unknown;
};

export type AnuncioAtivo = {
  id: string;
  perfil_id: string;
  modelo_id: string;
  tamanho: string;
  quantidade: number;
  escola: string;
  estado: "bom" | "regular";
  foto_path: string | null;
  criado_em: string;
};

export type Placar = {
  concluidas: number;
  contaveis: number;
  pecas: number;
  faltam: number;
};

export type Contato = { nome: string | null; telefone: string; papel: string };

/** Só repassa mensagem do banco que foi escrita para o usuário final. */
function mensagemRpc(bruta: string | null, fallback: string) {
  if (!bruta) return fallback;
  const conhecidas = [
    "Entre com seu WhatsApp",
    "não está mais disponível",
    "Este anúncio é seu",
    "Pedido não encontrado",
    "Doação não encontrada",
  ];
  return conhecidas.some((t) => bruta.includes(t)) ? bruta : fallback;
}

function extensaoFoto(tipo: string) {
  if (tipo === "image/png") return "png";
  if (tipo === "image/webp") return "webp";
  if (tipo === "image/heic" || tipo === "image/heif") return "heic";
  return "jpg";
}

export async function publicarAnuncio(
  ex: Executor,
  entrada: EntradaAnuncio,
): Promise<Resultado<{ anuncioId: string }>> {
  const analise = anuncioSchema.safeParse(entrada);
  if (!analise.success) return errado(analise.error.issues[0].message);

  const { foto } = entrada;
  if (!foto || foto.tamanho === 0) return errado("Envie uma foto da peça.");
  if (foto.tamanho > FOTO_MAX) return errado("A foto precisa ter menos de 5 MB.");
  if (!FOTO_TIPOS.has(foto.tipo)) return errado("Use uma foto JPG, PNG ou WEBP.");

  // A policy do Storage exige a pasta com o id do dono.
  const path = `${ex.uid}/${crypto.randomUUID()}.${extensaoFoto(foto.tipo)}`;
  const { error: erroFoto } = await ex.db.storage
    .from("anuncios")
    .upload(path, foto.conteudo, { contentType: foto.tipo, upsert: false });
  if (erroFoto) return errado("Não conseguimos enviar a foto. Tente de novo.");

  const { data, error } = await ex.db
    .from("anuncio")
    .insert({
      perfil_id: ex.uid,
      modelo_id: analise.data.modelo,
      tamanho: analise.data.tamanho,
      quantidade: analise.data.quantidade,
      escola: analise.data.escola,
      estado: analise.data.estado,
      foto_path: path,
    })
    .select("id")
    .single();

  if (error || !data) {
    return errado("Não conseguimos publicar o anúncio. Tente de novo.");
  }

  const anuncioId = data.id as string;
  try {
    const { avisarQuemProcura } = await import("@/lib/whatsapp/alerta");
    await avisarQuemProcura({
      id: anuncioId,
      perfil_id: ex.uid,
      modelo_id: analise.data.modelo,
      tamanho: analise.data.tamanho,
    });
  } catch (erro) {
    console.error("Alerta de procuro falhou; o anúncio foi publicado.", erro);
  }

  return certo({ anuncioId });
}

export async function pedirPeca(
  ex: Executor,
  anuncioId: string,
): Promise<Resultado<{ doacaoId: string }>> {
  if (!uuidSchema.safeParse(anuncioId).success) {
    return errado("Peça inválida.");
  }

  const { dados, erro } = await ex.rpc<string>("pedir_peca", {
    p_anuncio_id: anuncioId,
  });

  if (erro || !dados) {
    return errado(mensagemRpc(erro, "Esta peça não está mais disponível."));
  }

  return certo({ doacaoId: dados });
}

export async function responderPedido(
  ex: Executor,
  doacaoId: string,
  aceitar: boolean,
): Promise<Resultado<{ resposta: string }>> {
  if (!uuidSchema.safeParse(doacaoId).success) {
    return errado("Pedido inválido.");
  }

  const { dados, erro } = await ex.rpc<string>("responder_pedido", {
    p_doacao_id: doacaoId,
    p_aceitar: aceitar,
  });

  if (erro) return errado(mensagemRpc(erro, "Não conseguimos responder agora."));

  return certo({ resposta: dados ?? "" });
}

export async function confirmarEntrega(
  ex: Executor,
  doacaoId: string,
): Promise<Resultado<{ situacao: string }>> {
  if (!uuidSchema.safeParse(doacaoId).success) {
    return errado("Doação inválida.");
  }

  const { dados, erro } = await ex.rpc<string>("confirmar_entrega", {
    p_doacao_id: doacaoId,
  });

  if (erro) return errado(mensagemRpc(erro, "Não conseguimos confirmar agora."));

  return certo({ situacao: dados ?? "" });
}

export async function salvarProcuro(
  ex: Executor,
  entrada: EntradaProcuro,
): Promise<Resultado> {
  const analise = procuroSchema.safeParse(entrada);
  if (!analise.success) return errado(analise.error.issues[0].message);

  const escola =
    typeof entrada.escola === "string" && entrada.escola.trim().length >= 2
      ? entrada.escola.trim().slice(0, 160)
      : null;

  const { error } = await ex.db.from("procuro").insert({
    perfil_id: ex.uid,
    modelo_id: analise.data.modelo,
    tamanho: analise.data.tamanho,
    escola,
  });

  // Índice único de "procuro" ativo: pedir de novo é sucesso, não erro.
  if (error && error.code !== "23505") {
    return errado("Não conseguimos salvar o aviso. Tente de novo.");
  }

  return certo(null);
}

export async function contarAnunciosAtivos(filtro: {
  modelo?: string;
  tamanho?: string;
  escola?: string;
}): Promise<number> {
  const db = createSupabaseAdminClient();
  const { data } = await db.rpc("contar_anuncios_ativos", {
    p_modelo_id: filtro.modelo ?? "",
    p_tamanho: filtro.tamanho ?? "",
    p_escola: filtro.escola ?? "",
  });
  return typeof data === "number" ? data : 0;
}

export async function listarAnunciosAtivos(filtro: {
  modelo?: string;
  tamanho?: string;
  escola?: string;
  excluirPerfilId?: string;
  limite?: number;
}): Promise<AnuncioAtivo[]> {
  const db = createSupabaseAdminClient();
  let query = db
    .from("anuncio")
    .select(
      "id, perfil_id, modelo_id, tamanho, quantidade, escola, estado, foto_path, criado_em",
    )
    .eq("status", "ativo")
    .order("criado_em", { ascending: false })
    .limit(filtro.limite ?? 60);

  if (filtro.modelo) query = query.eq("modelo_id", filtro.modelo);
  if (filtro.tamanho) query = query.eq("tamanho", filtro.tamanho);
  if (filtro.escola) query = query.ilike("escola", `%${filtro.escola}%`);
  if (filtro.excluirPerfilId) {
    query = query.neq("perfil_id", filtro.excluirPerfilId);
  }

  const { data } = await query;
  return (data ?? []) as AnuncioAtivo[];
}

export async function placarDoacao(ex: Executor): Promise<Resultado<Placar>> {
  const { dados, erro } = await ex.rpc<Placar[]>("placar_doacao");
  if (erro) return errado("Não conseguimos carregar seu placar agora.");

  const linha = dados?.[0];
  return certo(linha ?? { concluidas: 0, contaveis: 0, pecas: 0, faltam: 2 });
}

export async function contatoDaDoacao(
  ex: Executor,
  doacaoId: string,
): Promise<Resultado<Contato | null>> {
  if (!uuidSchema.safeParse(doacaoId).success) return errado("Doação inválida.");

  const { dados, erro } = await ex.rpc<Contato[]>("contato_da_doacao", {
    p_doacao_id: doacaoId,
  });
  if (erro) return errado("Não conseguimos abrir o contato agora.");

  return certo(dados?.[0] ?? null);
}
