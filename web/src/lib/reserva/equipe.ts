import type { User } from "@supabase/supabase-js";

export const PERFIS_EQUIPE = ["admin", "producao", "balcao"] as const;

export type PerfilEquipe = (typeof PERFIS_EQUIPE)[number];

/** O que cada tela confere antes de agir. Cancelar fica só com a administração. */
export const ACOES_EQUIPE = ["ver", "editar", "status", "cancelar", "producao", "avisos"] as const;

export type AcaoEquipe = (typeof ACOES_EQUIPE)[number];

const VARIAVEIS: Record<PerfilEquipe, readonly string[]> = {
  admin: ["EQUIPE_ADMIN", "EQUIPE_TELEFONES", "EQUIPE_EMAILS"],
  producao: ["EQUIPE_PRODUCAO"],
  balcao: ["EQUIPE_BALCAO"],
};

const PERMISSOES: Record<PerfilEquipe, readonly AcaoEquipe[]> = {
  admin: ACOES_EQUIPE,
  producao: ["ver", "status", "producao", "avisos"],
  balcao: ["ver", "editar"],
};

const ROTULOS: Record<PerfilEquipe, string> = {
  admin: "administração",
  producao: "produção",
  balcao: "balcão",
};

function digitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function itens(nome: string) {
  return (process.env[nome] ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function membros(perfil: PerfilEquipe) {
  return VARIAVEIS[perfil].flatMap(itens);
}

/** Cada item é e-mail (tem @) ou telefone. Os dois podem ir na mesma lista. */
function casa(usuario: User, item: string) {
  if (item.includes("@")) return item === (usuario.email ?? "").toLowerCase();
  const telefone = digitos(usuario.phone ?? "");
  return telefone.length > 0 && telefone === digitos(item);
}

export function equipeConfigurada() {
  return PERFIS_EQUIPE.some((perfil) => membros(perfil).length > 0);
}

/** Uma pessoa em duas listas fica com as duas permissões. */
export function perfisDoUsuario(usuario: User): PerfilEquipe[] {
  return PERFIS_EQUIPE.filter((perfil) => membros(perfil).some((item) => casa(usuario, item)));
}

export function pessoaDaEquipe(usuario: User) {
  return perfisDoUsuario(usuario).length > 0;
}

/** Quem fica gravado no histórico: e-mail, ou o telefone quando o login é por WhatsApp. */
export function autorDoUsuario(usuario: User) {
  const email = (usuario.email ?? "").trim().toLowerCase();
  if (email) return email;
  return digitos(usuario.phone ?? "") || "equipe";
}

export function pode(perfis: readonly PerfilEquipe[], acao: AcaoEquipe) {
  return perfis.some((perfil) => PERMISSOES[perfil].includes(acao));
}

export function rotuloPerfis(perfis: readonly PerfilEquipe[]) {
  const nomes = perfis.map((perfil) => ROTULOS[perfil]);
  if (nomes.length <= 1) return nomes[0] ?? "";
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
