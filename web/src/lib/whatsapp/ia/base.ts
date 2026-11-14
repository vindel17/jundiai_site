import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { LIMITE_BASE } from "./regras";

export type BaseBot = {
  texto: string;
  atualizadoEm: string | null;
  autor: string;
};

export async function lerBaseBot(): Promise<BaseBot> {
  const { data, error } = await createSupabaseAdminClient()
    .from("base_bot")
    .select("texto, atualizado_em, atualizado_por")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return {
    texto: typeof data?.texto === "string" ? data.texto : "",
    atualizadoEm: typeof data?.atualizado_em === "string" ? data.atualizado_em : null,
    autor: typeof data?.atualizado_por === "string" ? data.atualizado_por : "",
  };
}

export async function salvarBaseBot(autor: string, texto: string) {
  const limpo = texto.replace(/\r\n/g, "\n").trim();
  if (limpo.length > LIMITE_BASE) return "longo" as const;
  const { error } = await createSupabaseAdminClient().rpc("salvar_base_bot", {
    p_autor: autor,
    p_texto: limpo,
  });
  if (error) throw error;
  return "salvo" as const;
}
