/**
 * Liga o número que mandou a mensagem à conta do site.
 *
 * Cuidado histórico: `perfil.telefone` vem de `auth.users.phone` (gravado no
 * login por OTP), enquanto o `wa_id` chega da Meta. Em número brasileiro os dois
 * podem divergir no nono dígito, então comparamos as duas formas — sem isso o
 * cliente antigo apareceria como novo e abriria conta duplicada.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Formas equivalentes do mesmo celular: com e sem o nono dígito, com e sem `+`. */
export function variacoesTelefone(bruto: string): string[] {
  const digitos = bruto.replace(/\D/g, "");
  if (!digitos) return [];

  const resto = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  if (resto.length < 10 || resto.length > 11) return [];

  const ddd = resto.slice(0, 2);
  const numero = resto.slice(2);

  const numeros = new Set([numero]);
  if (numero.length === 8) numeros.add(`9${numero}`);
  if (numero.length === 9 && numero.startsWith("9")) numeros.add(numero.slice(1));

  const semDdi = [...numeros].map((n) => `55${ddd}${n}`);
  return [...semDdi, ...semDdi.map((n) => `+${n}`)];
}

/** Forma canônica para criar conta: sempre com nono dígito e com `+`. */
export function telefoneCanonico(bruto: string): string | null {
  const candidatos = variacoesTelefone(bruto).filter((n) => n.startsWith("+"));
  return candidatos.find((n) => n.length === 14) ?? null;
}

export async function perfilPorWaId(waId: string): Promise<string | null> {
  const candidatos = variacoesTelefone(waId);
  if (candidatos.length === 0) return null;

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("perfil")
    .select("id")
    .in("telefone", candidatos)
    .limit(1)
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
}

/**
 * Cria a conta para quem chegou pelo WhatsApp sem cadastro.
 *
 * A mensagem prova a posse do número (é a mesma garantia do OTP), por isso o
 * telefone entra confirmado. O trigger `ao_criar_usuario` cria o `perfil`.
 *
 * Só chamar quando o usuário já pediu algo que exige conta — ver
 * `modelo-de-negocio.md` §4.2.
 */
export async function criarPerfilParaWaId(waId: string): Promise<string | null> {
  const telefone = telefoneCanonico(waId);
  if (!telefone) return null;

  const db = createSupabaseAdminClient();
  const { data, error } = await db.auth.admin.createUser({
    phone: telefone,
    phone_confirm: true,
  });

  if (error || !data.user) {
    // Corrida entre duas mensagens do mesmo número: a conta já existe.
    return perfilPorWaId(waId);
  }

  return data.user.id;
}
