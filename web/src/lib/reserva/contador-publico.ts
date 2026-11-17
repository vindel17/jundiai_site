import { supabaseConfigurado } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { lerContadorEquipe } from "./contador-consulta";

/** A função do banco devolve só o inteiro. A chave pública chega nela sem ler a tabela. */
export async function lerContadorPublico() {
  if (supabaseConfigurado) {
    try {
      const db = await createSupabaseServerClient();
      const { data, error } = await db.rpc("contador_kits_publico");
      if (!error && typeof data === "number" && Number.isInteger(data)) return Math.max(0, data);
    } catch (erro) {
      console.error("Falha ao ler o contador público", erro);
    }
  }

  const equipe = await lerContadorEquipe().catch(() => null);
  return equipe?.total ?? 0;
}
