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
  return `A cada ${PESSOAS_POR_PECA_EXTRA} famílias que reservarem por este link e comprarem o kit, você ganha uma camiseta extra.`;
}

/** Quantas famílias ainda faltam para fechar o próximo trio. */
export function faltamParaProximaCamiseta(familias: number) {
  const pessoas = Math.max(0, Math.floor(familias));
  const resto = pessoas % PESSOAS_POR_PECA_EXTRA;
  return resto === 0 ? PESSOAS_POR_PECA_EXTRA : PESSOAS_POR_PECA_EXTRA - resto;
}

/** Posição dentro do trio atual. Um trio recém-fechado aparece completo. */
export function passoDoTrio(familias: number) {
  const pessoas = Math.max(0, Math.floor(familias));
  const resto = pessoas % PESSOAS_POR_PECA_EXTRA;
  if (pessoas > 0 && resto === 0) return PESSOAS_POR_PECA_EXTRA;
  return resto;
}

export function textoConvite(link: string) {
  return [
    "Reserve o uniforme escolar de Jundiaí sem pagar agora. Eu já separei o meu:",
    "",
    link,
  ].join("\n");
}
