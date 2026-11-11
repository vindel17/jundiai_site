import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarTexto } from "./enviar";
import { lerRascunho } from "./fluxos/reserva-estado";
import { ErroRespostaWhatsApp } from "./graph";
import { dadoTexto } from "./sessao";
import type { EntradaUsuario } from "./tipos";

export const ATENDIMENTO = "/equipe/atendimento";
const JANELA_ATENDIMENTO_MS = 24 * 60 * 60 * 1000;
export const ID_ATENDIMENTO = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

type RotaEntrada = "duplicada" | "bot" | "novo" | "humano";

export class FalhaAoRegistrarEntrada extends Error {}

export async function registrarEntrada(entrada: EntradaUsuario, pediuAtendente: boolean) {
  const { data, error } = await createSupabaseAdminClient().rpc("receber_mensagem_whatsapp", {
    p_id: entrada.mensagemId,
    p_wa_id: entrada.waId,
    p_texto: entrada.texto.trim() || (entrada.tipo === "imagem" ? "[Imagem]" : "[Mensagem sem texto]"),
    p_pediu_atendente: pediuAtendente,
    p_enviada_em: entrada.enviadaEm ?? null,
  });
  if (error) throw new FalhaAoRegistrarEntrada(error.message);
  return data as RotaEntrada;
}

export type Atendimento = {
  id: string;
  wa_id: string;
  aberto_em: string;
  atendente: string | null;
  encerrado_em: string | null;
};

type Mensagem = {
  id: string;
  origem: "cliente" | "equipe";
  texto: string;
  estado: "recebida" | "enviando" | "aceita" | "recusada" | "incerta";
  criado_em: string;
};

const COLUNAS = "id, wa_id, aberto_em, atendente, encerrado_em";

export async function listarAtendimentos(pagina: number) {
  const limite = 30;
  const inicio = (pagina - 1) * limite;
  const { data, error } = await createSupabaseAdminClient()
    .from("atendimento_whatsapp")
    .select(COLUNAS)
    .is("encerrado_em", null)
    .order("aberto_em")
    .order("id")
    .range(inicio, inicio + limite);
  if (error) throw error;
  const filas = data as Atendimento[];
  return { filas: filas.slice(0, limite), temMais: filas.length > limite };
}

export async function obterAtendimento(id: string) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("atendimento_whatsapp").select(COLUNAS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const atendimento: Atendimento = data;

  const [historico, conversa] = await Promise.all([
    db.from("atendimento_mensagem")
      .select("id, origem, texto, estado, criado_em")
      .eq("atendimento_id", id)
      .order("criado_em", { ascending: false })
      .order("id", { ascending: false })
      .limit(100),
    db.from("agente_conversa")
      .select("ultima_entrada_em, passo, dados")
      .eq("wa_id", atendimento.wa_id)
      .single(),
  ]);
  if (historico.error) throw historico.error;
  if (conversa.error) throw conversa.error;

  const agora = Date.now();
  const { passo, dados } = conversa.data;
  const reserva = passo.startsWith("reserva_") && passo !== "reserva_retomar"
    ? dados
    : lerRascunho(dados)?.dados;
  return {
    atendimento,
    mensagens: (historico.data as Mensagem[]).reverse(),
    naJanela: agora - Date.parse(conversa.data.ultima_entrada_em) < JANELA_ATENDIMENTO_MS,
    respostaId: randomUUID(),
    rascunho: reserva ? [dadoTexto(reserva, "aluno"), dadoTexto(reserva, "escola")].filter(Boolean).join(" · ") : "",
  };
}

export async function mudarAtendimento(id: string, autor: string, encerrar: boolean) {
  const { data, error } = await createSupabaseAdminClient().rpc("mudar_atendimento_whatsapp", {
    p_id: id, p_autor: autor, p_encerrar: encerrar,
  });
  if (error) throw error;
  return data === true;
}

export async function responderAtendimento(id: string, autor: string, mensagem: string, texto: string) {
  const db = createSupabaseAdminClient();
  const { data: numero, error } = await db.rpc("preparar_resposta_whatsapp", {
    p_id: id, p_autor: autor, p_mensagem: mensagem, p_texto: texto,
  });
  if (error) throw error;
  if (typeof numero !== "string") return "indisponivel";

  let estado = "aceita";
  try {
    await enviarTexto(numero, texto, { signal: AbortSignal.timeout(10_000) });
  } catch (erro) {
    estado = erro instanceof ErroRespostaWhatsApp && erro.status < 500 ? "recusada" : "incerta";
    console.warn("Falha ao enviar resposta de atendimento", { mensagem, estado });
  }

  const resultado = await db.from("atendimento_mensagem")
    .update({ estado })
    .eq("id", mensagem)
    .eq("atendimento_id", id)
    .eq("estado", "enviando");
  if (resultado.error) throw resultado.error;
  return estado;
}
