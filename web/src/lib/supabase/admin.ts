import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Cliente com `service_role` — ignora RLS.
 *
 * Só para o que roda sem sessão de cookie (webhook do WhatsApp, jobs). Como a
 * RLS não protege aqui, todo comando precisa filtrar pelo dono explicitamente;
 * as funções `_como(p_uid, …)` do banco fazem essa checagem por dentro.
 *
 * Nunca importar em componente de cliente: a chave não tem prefixo público e
 * vazaria no bundle.
 */
let cliente: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  const chave =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!SUPABASE_URL || !chave) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_URL são obrigatórios para o agente",
    );
  }

  cliente ??= createClient(SUPABASE_URL, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cliente;
}

export function adminConfigurado(): boolean {
  return Boolean(
    SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY),
  );
}
