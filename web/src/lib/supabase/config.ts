/**
 * Credenciais públicas do Supabase.
 *
 * Projetos criados a partir de 2026 só oferecem a *publishable key*
 * (`sb_publishable_...`); a antiga `anon` continua valendo nos projetos
 * anteriores. As duas têm o mesmo privilégio e respeitam RLS, então
 * aceitamos qualquer uma — cada `process.env` precisa ser escrito por
 * extenso para o Next conseguir substituir o valor no bundle.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** Sem Supabase o site segue funcionando: venda, etiquetas e vitrine borrada. */
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
