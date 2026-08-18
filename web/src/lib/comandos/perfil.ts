/**
 * Comandos de perfil — regra única para site e WhatsApp.
 *
 * Atenção: o agente roda com `service_role`, que ignora o `grant update
 * (nome_responsavel)` da migração 0004. Por isso o update abaixo lista o campo
 * explicitamente — nunca montar o objeto a partir da entrada crua.
 */

import { z } from "zod";
import { certo, errado, type Executor, type Resultado } from "./tipos";

const perfilSchema = z.object({
  nomeResponsavel: z.string().trim().min(3, "Informe seu nome completo").max(120),
  filhoNome: z.string().trim().min(2, "Informe o nome do aluno").max(60),
  filhoEscola: z.string().trim().min(2, "Informe a escola").max(160),
  filhoTamanho: z.string().trim().max(10).optional().default(""),
});

export type EntradaPerfil = {
  nomeResponsavel: unknown;
  filhoNome: unknown;
  filhoEscola: unknown;
  filhoTamanho?: unknown;
};

export type PlacarIndicacao = {
  codigo: string | null;
  acessos: number;
  cadastros: number;
  pendente_centavos: number;
  confirmado_centavos: number;
  camisetas: number;
  faltam_centavos: number;
  etiquetas_dtf: number;
  indicado: boolean;
};

/** Perfil só vale como lead quando tem aluno (modelo-de-negocio.md §4.2). */
export async function temFilho(ex: Executor): Promise<boolean> {
  const { count } = await ex.db
    .from("filho")
    .select("id", { count: "exact", head: true })
    .eq("perfil_id", ex.uid);
  return (count ?? 0) > 0;
}

export type PerfilLeve = {
  nome: string | null;
  temFilho: boolean;
  filhoEscola: string | null;
};

export async function lerPerfilLeve(ex: Executor): Promise<PerfilLeve> {
  const { data: perfil } = await ex.db
    .from("perfil")
    .select("nome_responsavel")
    .eq("id", ex.uid)
    .maybeSingle();

  const { data: filho } = await ex.db
    .from("filho")
    .select("escola")
    .eq("perfil_id", ex.uid)
    .order("criado_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    nome: (perfil?.nome_responsavel as string | null) ?? null,
    temFilho: Boolean(filho),
    filhoEscola: (filho?.escola as string | null) ?? null,
  };
}

/**
 * Enriquecimento progressivo do lead. Não pede o que já tem; não cria filho
 * duplicado. O nome do aluno, se faltar, usa o primeiro nome do responsável.
 */
export async function completarLead(
  ex: Executor,
  entrada: { nome?: string; escola?: string; tamanho?: string },
): Promise<Resultado<PerfilLeve>> {
  const nome = entrada.nome?.trim() ?? "";
  if (nome.length >= 3) {
    const { error } = await ex.db
      .from("perfil")
      .update({ nome_responsavel: nome.slice(0, 120) })
      .eq("id", ex.uid);
    if (error) return errado("Não conseguimos salvar seu nome. Tente de novo.");
  }

  if (!(await temFilho(ex))) {
    const escola = entrada.escola?.trim() ?? "";
    if (escola.length >= 2) {
      const base = (nome || "Aluno").split(/\s+/)[0] ?? "Aluno";
      const filhoNome = base.length >= 2 ? base.slice(0, 60) : "Aluno";
      const { error } = await ex.db.from("filho").insert({
        perfil_id: ex.uid,
        nome: filhoNome,
        escola: escola.slice(0, 160),
        tamanho_atual: entrada.tamanho?.trim().slice(0, 10) || null,
      });
      if (error) return errado("Não conseguimos salvar a escola. Tente de novo.");
      await ex.rpc<number>("liberar_etiqueta_boas_vindas");
    }
  }

  return certo(await lerPerfilLeve(ex));
}

export async function salvarPerfil(
  ex: Executor,
  entrada: EntradaPerfil,
): Promise<Resultado<{ etiquetas: number }>> {
  const analise = perfilSchema.safeParse(entrada);
  if (!analise.success) return errado(analise.error.issues[0].message);

  const dados = analise.data;

  const { error: erroPerfil } = await ex.db
    .from("perfil")
    .update({ nome_responsavel: dados.nomeResponsavel })
    .eq("id", ex.uid);

  if (erroPerfil) return errado("Não conseguimos salvar seu nome. Tente de novo.");

  const { error: erroFilho } = await ex.db.from("filho").insert({
    perfil_id: ex.uid,
    nome: dados.filhoNome,
    escola: dados.filhoEscola,
    tamanho_atual: dados.filhoTamanho || null,
  });

  if (erroFilho) return errado("Não conseguimos salvar o aluno. Tente de novo.");

  const { dados: etiquetas } = await ex.rpc<number>("liberar_etiqueta_boas_vindas");

  return certo({ etiquetas: etiquetas ?? 0 });
}

export async function placarIndicacao(
  ex: Executor,
): Promise<Resultado<PlacarIndicacao | null>> {
  const { dados, erro } = await ex.rpc<PlacarIndicacao[]>("placar_indicacao");
  if (erro) return errado("Não conseguimos carregar seus benefícios agora.");
  return certo(dados?.[0] ?? null);
}

export async function registrarCompra(
  ex: Executor,
  valorCentavos: number,
): Promise<Resultado> {
  if (!Number.isInteger(valorCentavos) || valorCentavos < 100) {
    return errado("Valor inválido.");
  }

  const { erro } = await ex.rpc<string>("registrar_compra", {
    p_valor_centavos: valorCentavos,
  });
  if (erro) return errado("Não conseguimos registrar a compra agora.");

  return certo(null);
}
