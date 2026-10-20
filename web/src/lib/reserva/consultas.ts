import { variacoesTelefone } from "@/lib/whatsapp/identidade";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { eTamanhoKit, reservaAberta, type KitGenero, type TamanhosKit } from "./kit";
import { CANAIS_ORIGEM, type CanalOrigem } from "./origem";

export type ReservaLinha = {
  id: string;
  telefone: string;
  origemCanal: CanalOrigem;
  origemCodigo: string;
  escola: string;
  aluno: string;
  kit: KitGenero;
  tamanhos: TamanhosKit;
  status: string;
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
  tamanho_curta: TamanhosKit["curta"];
  tamanho_longa: TamanhosKit["longa"];
  tamanho_inferior: TamanhosKit["inferior"];
  tamanho_calca: TamanhosKit["calca"];
  tamanho_blusa: TamanhosKit["blusa"];
  status: string;
  criado_em: string;
};

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
    status: row.status,
    criadoEm: row.criado_em,
  };
}

const COLUNAS =
  "id, telefone, origem_canal, origem_codigo, escola, aluno_nome, kit, tamanho_curta, tamanho_longa, tamanho_inferior, tamanho_calca, tamanho_blusa, status, criado_em";

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

export async function listarReservas(filtro: { escola?: string; canal?: string }) {
  const db = createSupabaseAdminClient();
  let consulta = db
    .from("reserva")
    .select(COLUNAS)
    .order("criado_em", { ascending: false })
    .limit(100);

  const escola = filtro.escola?.trim();
  if (escola) consulta = consulta.ilike("escola", `%${escola}%`);
  if (filtro.canal && (CANAIS_ORIGEM as readonly string[]).includes(filtro.canal)) {
    consulta = consulta.eq("origem_canal", filtro.canal);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return ((data ?? []) as LinhaBanco[]).map(paraLinha);
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

export async function atualizarTamanhos(id: string, tamanhos: TamanhosKit) {
  if (!reservaAberta()) return { erro: "O prazo para mudar tamanho terminou em 31 de dezembro." };
  if (Object.values(tamanhos).some((tamanho) => !eTamanhoKit(tamanho))) {
    return { erro: "Escolha um tamanho da grade." };
  }

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("reserva")
    .update({
      tamanho_curta: tamanhos.curta,
      tamanho_longa: tamanhos.longa,
      tamanho_inferior: tamanhos.inferior,
      tamanho_calca: tamanhos.calca,
      tamanho_blusa: tamanhos.blusa,
    })
    .eq("id", id)
    .eq("status", "recebida");

  if (error) return { erro: "Não consegui salvar o tamanho." };
  return { ok: true as const };
}
