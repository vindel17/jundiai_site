import { siteUrl } from "@/lib/config-publica";

export function urlSite(caminho = "") {
  const origem = siteUrl();
  if (!caminho) return origem;
  return `${origem}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
