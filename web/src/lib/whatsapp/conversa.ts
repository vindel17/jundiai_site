/**
 * Estado da conversa e idempotência.
 *
 * Fica no Postgres, não em memória: o Render reinicia, hiberna e pode rodar
 * mais de uma instância — estado em processo se perderia no meio do fluxo.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type Conversa = {
  waId: string;
  perfilId: string | null;
  passo: string;
  dados: Record<string, unknown>;
};

export type PatchConversa = {
  perfilId?: string | null;
  passo?: string;
  dados?: Record<string, unknown>;
};

export async function carregarConversa(waId: string): Promise<Conversa> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("agente_conversa")
    .select("wa_id, perfil_id, passo, dados")
    .eq("wa_id", waId)
    .maybeSingle();

  return {
    waId,
    perfilId: (data?.perfil_id as string | null) ?? null,
    passo: (data?.passo as string | undefined) ?? "inicio",
    dados: (data?.dados as Record<string, unknown> | undefined) ?? {},
  };
}

export async function salvarConversa(waId: string, patch: PatchConversa) {
  const db = createSupabaseAdminClient();

  const linha: Record<string, unknown> = {
    wa_id: waId,
  };
  if (patch.perfilId !== undefined) linha.perfil_id = patch.perfilId;
  if (patch.passo !== undefined) linha.passo = patch.passo;
  if (patch.dados !== undefined) linha.dados = patch.dados;

  const { error } = await db
    .from("agente_conversa")
    .upsert(linha, { onConflict: "wa_id" });

  if (error) throw new Error(`Falha ao salvar conversa: ${error.message}`);
}
