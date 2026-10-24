import { variacoesTelefone } from "@/lib/whatsapp/identidade";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { eEntrega, type Entrega } from "./entrega";
import {
  reservaAberta,
  tamanhosValidos,
  type KitGenero,
  type TamanhoKit,
  type TamanhosKit,
} from "./kit";
import { CANAIS_ORIGEM, type CanalOrigem } from "./origem";
import { eStatusReserva, STATUS_EDITAVEIS, type StatusReserva } from "./status";

export type ReservaLinha = {
  id: string;
  telefone: string;
  origemCanal: CanalOrigem;
  origemCodigo: string;
  escola: string;
  aluno: string;
  kit: KitGenero;
  tamanhos: TamanhosKit;
  /** `null` nas reservas feitas antes da pergunta de entrega. */
  entrega: Entrega | null;
  status: StatusReserva;
  criadoEm: string;
};

type LinhaBanco = {
  id: string;
  telefone: string;
  origem_canal: CanalOrigem;
  origem_codigo: string;
  escola: string;
  aluno_nome: string;
  kit: KitGenero;
  tamanho_curta: TamanhoKit | null;
  tamanho_longa: TamanhoKit | null;
  tamanho_inferior: TamanhoKit | null;
  tamanho_calca: TamanhoKit | null;
  tamanho_blusa: TamanhoKit | null;
  entrega: string | null;
  status: StatusReserva;
  criado_em: string;
};

export function colunasTamanho(tamanhos: TamanhosKit) {
  return {
    tamanho_curta: tamanhos.curta,
    tamanho_longa: tamanhos.longa,
    tamanho_inferior: tamanhos.inferior,
    tamanho_calca: tamanhos.calca,
    tamanho_blusa: tamanhos.blusa,
  };
}

function paraLinha(row: LinhaBanco): ReservaLinha {
  return {
    id: row.id,
    telefone: row.telefone,
    origemCanal: row.origem_canal,
    origemCodigo: row.origem_codigo,
    escola: row.escola,
    aluno: row.aluno_nome,
    kit: row.kit,
    tamanhos: {
      curta: row.tamanho_curta,
      longa: row.tamanho_longa,
      inferior: row.tamanho_inferior,
      calca: row.tamanho_calca,
      blusa: row.tamanho_blusa,
    },
    entrega: row.entrega && eEntrega(row.entrega) ? row.entrega : null,
    status: row.status,
    criadoEm: row.criado_em,
  };
}

const COLUNAS =
  "id, telefone, origem_canal, origem_codigo, escola, aluno_nome, kit, tamanho_curta, tamanho_longa, tamanho_inferior, tamanho_calca, tamanho_blusa, entrega, status, criado_em";

export const RESERVAS_POR_PAGINA = 50;

export type FiltroReservas = {
  busca?: string;
  escola?: string;
  canal?: string;
  status?: string;
  kit?: string;
  entrega?: string;
  pagina?: number;
};

/** Tira o que quebraria o filtro do banco: vírgula, curingas e ponto. */
function trecho(valor: string | undefined) {
  return (valor ?? "")
    .replace(/[%_,.*()\\:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function telefonesEquivalentes(bruto: string) {
  return [
    ...new Set(variacoesTelefone(bruto).map((telefone) => telefone.replace(/\D/g, ""))),
  ];
}

export async function listarReservasDoTelefone(bruto: string) {
  const telefones = telefonesEquivalentes(bruto);
  if (telefones.length === 0) return { linhas: [] as ReservaLinha[], codigo: "" };

  const db = createSupabaseAdminClient();
  const [reservas, familia] = await Promise.all([
    db
      .from("reserva")
      .select(COLUNAS)
      .in("telefone", telefones)
      .order("criado_em", { ascending: false }),
    db
      .from("reserva_familia")
      .select("codigo_indicacao")
      .in("telefone", telefones)
      .limit(1)
      .maybeSingle(),
  ]);
  if (reservas.error) throw new Error(reservas.error.message);

  return {
    linhas: ((reservas.data ?? []) as LinhaBanco[]).map(paraLinha),
    codigo: (familia.data?.codigo_indicacao as string | undefined) ?? "",
  };
}

export async function listarReservas(filtro: FiltroReservas) {
  const db = createSupabaseAdminClient();
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const inicio = (pagina - 1) * RESERVAS_POR_PAGINA;
  let consulta = db
    .from("reserva")
    .select(COLUNAS, { count: "exact" })
    .order("criado_em", { ascending: false })
    .range(inicio, inicio + RESERVAS_POR_PAGINA - 1);

  const busca = trecho(filtro.busca);
  const fone = busca.replace(/\D/g, "");
  const partes = [
    busca ? `aluno_nome.ilike.%${busca}%` : "",
    fone.length >= 4 ? `telefone.ilike.%${fone}%` : "",
  ].filter(Boolean);
  if (partes.length > 0) consulta = consulta.or(partes.join(","));

  const escola = trecho(filtro.escola);
  if (escola) consulta = consulta.ilike("escola", `%${escola}%`);
  if (filtro.canal && (CANAIS_ORIGEM as readonly string[]).includes(filtro.canal)) {
    consulta = consulta.eq("origem_canal", filtro.canal);
  }
  if (filtro.status && eStatusReserva(filtro.status)) consulta = consulta.eq("status", filtro.status);
  if (filtro.kit === "masculino" || filtro.kit === "feminino") {
    consulta = consulta.eq("kit", filtro.kit);
  }
  if (filtro.entrega === "nao") consulta = consulta.is("entrega", null);
  else if (filtro.entrega && eEntrega(filtro.entrega)) consulta = consulta.eq("entrega", filtro.entrega);

  const { data, error, count } = await consulta;
  if (error) throw new Error(error.message);
  return {
    linhas: ((data ?? []) as LinhaBanco[]).map(paraLinha),
    total: count ?? 0,
  };
}

export async function obterReserva(id: string) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("reserva")
    .select(COLUNAS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? paraLinha(data as LinhaBanco) : null;
}

/**
 * `entrega` nula mantém reservas antigas, feitas antes da pergunta de entrega.
 * Só grava em status editável; reserva em produção volta como `travada`.
 */
export async function atualizarReserva(id: string, tamanhos: TamanhosKit, entrega: Entrega | null) {
  if (!reservaAberta()) {
    return { erro: "O prazo para mudar tamanho terminou em 31 de dezembro.", motivo: "prazo" as const };
  }
  if (!tamanhosValidos(tamanhos) || (entrega !== null && !eEntrega(entrega))) {
    return { erro: "Escolha ao menos uma peça, com tamanho da grade.", motivo: "tamanho" as const };
  }

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("reserva")
    .update({ ...colunasTamanho(tamanhos), entrega })
    .eq("id", id)
    .in("status", STATUS_EDITAVEIS)
    .select("id");

  if (error) return { erro: "Não consegui salvar a reserva.", motivo: "falha" as const };
  if (!data?.length) {
    return { erro: "A reserva já entrou em produção.", motivo: "travada" as const };
  }
  return { ok: true as const };
}
