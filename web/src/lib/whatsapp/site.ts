import { origemPublica } from "@/lib/indicacao/regras";
import { qsReceber, type FiltroReceber } from "@/lib/doacao/modelos";

export function urlSite(caminho = "") {
  const origem = origemPublica();
  if (!caminho) return origem;
  return `${origem}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}

export function urlFeedDoacao(filtro: FiltroReceber) {
  return urlSite(qsReceber(filtro, {}));
}
