import { CANAIS_ORIGEM, type CanalOrigem } from "@/lib/reserva/origem";
import { EXTRAS, FUNIL, type CanalMetrica } from "./etapas";

/** Uma linha de `metrica_funil`: pessoas distintas naquela etapa e origem. */
export type LinhaFunil = {
  canal: CanalMetrica;
  etapa: string;
  origem_canal: CanalOrigem;
  pessoas: number;
};

export type PassoFunil = {
  etapa: string;
  rotulo: string;
  pessoas: number;
  /** % de quem seguiu em relação ao passo anterior. `null` no primeiro. */
  doAnterior: number | null;
  /** % em relação ao primeiro passo. */
  doInicio: number | null;
};

export type FunilDoCanal = {
  passos: PassoFunil[];
  extras: { etapa: string; rotulo: string; pessoas: number }[];
  /** Passo em que mais gente fica pelo caminho, com pelo menos uma pessoa chegando. */
  maiorPerda: { de: string; para: string; seguem: number } | null;
};

export type OrigemDoFunil = {
  origem: CanalOrigem;
  /** Pessoas em cada passo, na ordem do funil. */
  pessoas: number[];
  /** Do primeiro ao último passo. `null` se ninguém começou. */
  conversao: number | null;
};

function somar(linhas: readonly LinhaFunil[], canal: CanalMetrica, etapa: string, origem?: CanalOrigem) {
  return linhas
    .filter(
      (linha) =>
        linha.canal === canal &&
        linha.etapa === etapa &&
        (origem === undefined || linha.origem_canal === origem),
    )
    .reduce((soma, linha) => soma + Number(linha.pessoas), 0);
}

function porcentagem(parte: number, todo: number) {
  return todo > 0 ? (parte / todo) * 100 : null;
}

export function montarFunil(linhas: readonly LinhaFunil[], canal: CanalMetrica): FunilDoCanal {
  const totais = FUNIL[canal].map((passo) => somar(linhas, canal, passo.etapa));
  const passos = FUNIL[canal].map((passo, indice) => ({
    etapa: passo.etapa,
    rotulo: passo.rotulo,
    pessoas: totais[indice],
    doAnterior: indice === 0 ? null : porcentagem(totais[indice], totais[indice - 1]),
    doInicio: indice === 0 ? null : porcentagem(totais[indice], totais[0]),
  }));

  let maiorPerda: FunilDoCanal["maiorPerda"] = null;
  let menor = Infinity;
  passos.forEach((passo, indice) => {
    if (indice === 0 || passo.doAnterior === null || passo.doAnterior >= menor) return;
    menor = passo.doAnterior;
    maiorPerda = {
      de: passos[indice - 1].rotulo,
      para: passo.rotulo,
      seguem: passo.doAnterior,
    };
  });

  return {
    passos,
    extras: EXTRAS[canal].map((extra) => ({ ...extra, pessoas: somar(linhas, canal, extra.etapa) })),
    maiorPerda,
  };
}

export function funilPorOrigem(
  linhas: readonly LinhaFunil[],
  canal: CanalMetrica,
): OrigemDoFunil[] {
  return CANAIS_ORIGEM.map((origem) => {
    const pessoas = FUNIL[canal].map((passo) => somar(linhas, canal, passo.etapa, origem));
    return {
      origem,
      pessoas,
      conversao: porcentagem(pessoas[pessoas.length - 1], pessoas[0]),
    };
  }).filter((linha) => linha.pessoas.some((quantidade) => quantidade > 0));
}

export function formatarPorcentagem(valor: number | null) {
  if (valor === null) return "—";
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}
