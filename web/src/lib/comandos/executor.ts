/**
 * As duas portas de entrada dos comandos.
 *
 * Site: sessão de cookie, RLS ativa, RPC `public.X(...)`.
 * Agente: `service_role`, sem cookie, RPC `public.X_como(p_uid, ...)`.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Executor, RespostaRpc } from "./tipos";

/** Executor do site. `null` quando a sessão expirou. */
export async function executorDoUsuario(): Promise<Executor | null> {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) return null;

  return {
    canal: "site",
    db,
    uid: user.id,
    async rpc<T>(
      nome: string,
      args: Record<string, unknown> = {},
    ): Promise<RespostaRpc<T>> {
      const { data, error } = await db.rpc(nome, args);
      return { dados: (data ?? null) as T | null, erro: error?.message ?? null };
    },
  };
}

/**
 * Executor do agente. O `uid` já vem resolvido pelo telefone do webhook —
 * ver `lib/whatsapp/identidade.ts`.
 */
export function executorDoAgente(uid: string): Executor {
  const db = createSupabaseAdminClient();

  return {
    canal: "agente",
    db,
    uid,
    async rpc<T>(
      nome: string,
      args: Record<string, unknown> = {},
    ): Promise<RespostaRpc<T>> {
      const { data, error } = await db.rpc(`${nome}_como`, {
        p_uid: uid,
        ...args,
      });
      return { dados: (data ?? null) as T | null, erro: error?.message ?? null };
    },
  };
}
