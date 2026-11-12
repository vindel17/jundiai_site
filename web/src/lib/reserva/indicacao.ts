import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { telefonesEquivalentes } from "./consultas";

export type Indicado = { telefone: string; criadoEm: string };

export type PlacarIndicacaoReserva = {
  familias: number;
  ultimaEm: string | null;
};

const CODIGO = /^[a-z0-9]{8}$/;

/** Uma família conta uma vez. A própria conta não entra no placar. */
export function resumirIndicados(linhas: Indicado[], telefoneDono: string): PlacarIndicacaoReserva {
  const dono = new Set(telefonesEquivalentes(telefoneDono));
  const porFamilia = new Map<string, string>();

  for (const linha of linhas) {
    const formas = telefonesEquivalentes(linha.telefone);
    if (formas.some((telefone) => dono.has(telefone))) continue;
    const chave = formas[0] ?? linha.telefone;
    const atual = porFamilia.get(chave);
    if (!atual || linha.criadoEm > atual) porFamilia.set(chave, linha.criadoEm);
  }

  const datas = [...porFamilia.values()].sort();
  return { familias: porFamilia.size, ultimaEm: datas.at(-1) ?? null };
}

/** Famílias que reservaram pelo link, pelo telefone do padrinho ou pelo código. */
export async function placarDaIndicacao(telefone: string, codigos: string[]) {
  const variantes = telefonesEquivalentes(telefone);
  const codigosOk = [...new Set(codigos.map((codigo) => codigo.toLowerCase()).filter((codigo) => CODIGO.test(codigo)))];
  if (variantes.length === 0 && codigosOk.length === 0) {
    return { familias: 0, ultimaEm: null };
  }

  const db = createSupabaseAdminClient();
  const consultas = [];
  if (variantes.length > 0) {
    consultas.push(
      db
        .from("reserva")
        .select("telefone, criado_em")
        .in("indicado_por_telefone", variantes)
        .neq("status", "cancelada"),
    );
  }
  if (codigosOk.length > 0) {
    consultas.push(
      db
        .from("reserva")
        .select("telefone, criado_em")
        .eq("origem_canal", "indicacao")
        .in("origem_codigo", codigosOk)
        .neq("status", "cancelada"),
    );
  }

  const resultados = await Promise.all(consultas);
  const linhas: Indicado[] = [];
  for (const resultado of resultados) {
    if (resultado.error) throw new Error(resultado.error.message);
    for (const linha of resultado.data ?? []) {
      linhas.push({
        telefone: linha.telefone as string,
        criadoEm: linha.criado_em as string,
      });
    }
  }
  return resumirIndicados(linhas, telefone);
}
