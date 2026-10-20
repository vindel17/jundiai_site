import type { User } from "@supabase/supabase-js";

function digitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function lista(nome: string) {
  return (process.env[nome] ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function equipeConfigurada() {
  return lista("EQUIPE_TELEFONES").length > 0 || lista("EQUIPE_EMAILS").length > 0;
}

export function pessoaDaEquipe(usuario: User) {
  const telefones = new Set(lista("EQUIPE_TELEFONES").map(digitos));
  const emails = new Set(lista("EQUIPE_EMAILS"));
  const telefone = digitos(usuario.phone ?? "");
  const email = (usuario.email ?? "").toLowerCase();
  if (telefone && telefones.has(telefone)) return true;
  if (email && emails.has(email)) return true;
  return false;
}
