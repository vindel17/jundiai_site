export const COOKIE_INDICACAO = "uj_ind";
export const COOKIE_INDICACAO_DIAS = 30;
export const CODIGO_INDICACAO = /^[a-z0-9]{8}$/;
export const FAIXA_CAMISETA_CENTAVOS = 35_000;
export const CONFIRMACAO_DIAS = 7;

export function urlIndicacao(origem: string, codigo: string) {
  return `${origem}/i/${codigo}`;
}

/** Indicados que reservaram e compraram para cada peça extra. A contagem não tem teto. */
export const PESSOAS_POR_PECA_EXTRA = 3;

/**
 * Peças extras do link de reserva. 3 pessoas valem 1 peça, 6 valem 2, e segue.
 * Cada pessoa indicada entra uma vez, quando reserva o kit e compra.
 */
export function pecasExtrasPorIndicacao(pessoasQueReservaramECompraram: number) {
  const pessoas = Math.floor(pessoasQueReservaramECompraram);
  if (pessoas < PESSOAS_POR_PECA_EXTRA) return 0;
  return Math.floor(pessoas / PESSOAS_POR_PECA_EXTRA);
}

export function textoPremioIndicacao() {
  return `A cada ${PESSOAS_POR_PECA_EXTRA} pessoas que reservarem o kit por esse link e comprarem, você ganha uma peça extra.`;
}

export function textoConvite(link: string) {
  return [
    "O uniforme da rede municipal de Jundiaí.",
    "",
    link,
    "",
    "Quem chega por aqui cria conta, coloca o nome do aluno e ganha 1 etiqueta. Na primeira compra, são 5.",
  ].join("\n");
}
