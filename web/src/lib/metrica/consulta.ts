import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LinhaFunil } from "./funil";

export const PERIODOS = [
  { valor: "7", rotulo: "Últimos 7 dias", dias: 7 },
  { valor: "30", rotulo: "Últimos 30 dias", dias: 30 },
  { valor: "tudo", rotulo: "Desde o início", dias: null },
] as const;

export type Periodo = (typeof PERIODOS)[number]["valor"];

export function lerPeriodo(valor: string | undefined): Periodo {
  return PERIODOS.find((periodo) => periodo.valor === valor)?.valor ?? "30";
}

function desde(periodo: Periodo) {
  const dias = PERIODOS.find((item) => item.valor === periodo)?.dias ?? null;
  return dias === null ? null : new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export async function lerFunil(periodo: Periodo): Promise<LinhaFunil[]> {
  const { data, error } = await createSupabaseAdminClient().rpc("metrica_funil", {
    p_desde: desde(periodo),
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as LinhaFunil[];
}
