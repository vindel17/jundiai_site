/**
 * Contrato da camada de comandos.
 *
 * Um comando é a regra de negócio de uma ação, sem saber quem chamou. O site
 * chama pelas server actions; o agente do WhatsApp chama pelo webhook. Os dois
 * recebem o mesmo `Resultado`, então nenhuma regra vive em dois lugares.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type Resultado<T = null> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

export function certo<T>(dados: T): Resultado<T> {
  return { ok: true, dados };
}

export function errado(erro: string): Resultado<never> {
  return { ok: false, erro };
}

/** De onde veio a chamada. Só para log e mensagem — a regra é a mesma. */
export type Canal = "site" | "agente";

export type RespostaRpc<T> = { dados: T | null; erro: string | null };

/**
 * Quem executa o comando.
 *
 * `rpc` existe porque as duas portas do banco têm nomes diferentes: o site usa
 * `public.X(...)` (identidade vem de `auth.uid()`) e o agente usa
 * `public.X_como(p_uid, ...)`. O comando chama sempre o nome curto.
 */
export type Executor = {
  canal: Canal;
  db: SupabaseClient;
  uid: string;
  rpc<T>(nome: string, args?: Record<string, unknown>): Promise<RespostaRpc<T>>;
};
