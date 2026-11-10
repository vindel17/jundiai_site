import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** O banco devolve no máximo 1000 linhas por consulta; lemos em páginas desse tamanho. */
const PAGINA = 1000;

/**
 * Reservas ativas (sem as canceladas) por escola. Um aluno vale uma reserva.
 * Quando o volume passar de algumas dezenas de milhares, trocar por uma função
 * no banco que já devolva o `group by`.
 */
export async function contarReservasPorEscola() {
  const db = createSupabaseAdminClient();
  const contagem: Record<string, number> = {};

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await db
      .from("reserva")
      .select("escola")
      .neq("status", "cancelada")
      .order("id")
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(error.message);

    for (const linha of data ?? []) {
      const escola = linha.escola as string;
      contagem[escola] = (contagem[escola] ?? 0) + 1;
    }
    if ((data?.length ?? 0) < PAGINA) return contagem;
  }
}
