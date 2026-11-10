import { curva } from "./desenho";
import { gabaritoEntre, type Forma } from "./forma";
import type { Faixa, Ponto } from "./glb";

/** Medidas da camiseta estendida, de frente, em centímetros. */
type MedidasCamiseta = {
  /** Do ponto mais alto do ombro (junto à gola) até a barra */
  comprimento: number;
  /** De axila a axila */
  largura: number;
  larguraGola: number;
  profundidadeGola: number;
  /** De ponta a ponta do ombro */
  larguraOmbros: number;
  /** Quanto a ponta do ombro desce em relação à gola */
  caidaOmbro: number;
  /** Da linha da gola até a altura da axila */
  alturaCava: number;
  comprimentoManga: number;
  bocaManga: number;
  /** Inclinação da manga abaixo da horizontal, em graus */
  anguloManga: number;
};

/** Comprimento e largura (axila a axila) de uma tabela de medidas, em cm. */
export type MedidaTabela = { comprimento: number; largura: number };

/** Comprimento e largura da tabela da camiseta manga curta, em cm. */
export const TABELA_CAMISETA = {
  "04": { comprimento: 45, largura: 35 },
  "06": { comprimento: 49, largura: 37 },
  "08": { comprimento: 53, largura: 39 },
} as const;

export type TamanhoCamiseta = keyof typeof TABELA_CAMISETA;

export const TAMANHOS_CAMISETA = Object.keys(TABELA_CAMISETA) as TamanhoCamiseta[];

/**
 * Proporções do tamanho 06, validado no AR. Gola, ombro e manga são
 * estimados — não é o molde real.
 */
const BASE_06: MedidasCamiseta = {
  comprimento: 49,
  largura: 37,
  larguraGola: 13,
  profundidadeGola: 6,
  larguraOmbros: 32,
  caidaOmbro: 3,
  alturaCava: 17,
  comprimentoManga: 14,
  bocaManga: 12,
  anguloManga: 25,
};

/** Medidas da tabela + demais pontos escalados a partir do 06. */
function estimarMedidas({ comprimento, largura }: MedidaTabela): MedidasCamiseta {
  const fx = largura / BASE_06.largura;
  const fz = comprimento / BASE_06.comprimento;
  return {
    comprimento,
    largura,
    larguraGola: BASE_06.larguraGola * fx,
    profundidadeGola: BASE_06.profundidadeGola * fz,
    larguraOmbros: BASE_06.larguraOmbros * fx,
    caidaOmbro: BASE_06.caidaOmbro * fz,
    alturaCava: BASE_06.alturaCava * fz,
    comprimentoManga: BASE_06.comprimentoManga * fx,
    bocaManga: BASE_06.bocaManga * fx,
    anguloManga: BASE_06.anguloManga,
  };
}

/** Metade direita do contorno, da gola (centro da frente) até o centro da barra. */
function metadeDireita(m: MedidasCamiseta): Ponto[] {
  const centroGola: Ponto = [0, m.profundidadeGola];
  const ladoGola: Ponto = [m.larguraGola / 2, 0];
  const ombro: Ponto = [m.larguraOmbros / 2, m.caidaOmbro];

  const a = (m.anguloManga * Math.PI) / 180;
  const pontaManga: Ponto = [
    ombro[0] + m.comprimentoManga * Math.cos(a),
    ombro[1] + m.comprimentoManga * Math.sin(a),
  ];
  const baixoManga: Ponto = [
    pontaManga[0] - m.bocaManga * Math.sin(a),
    pontaManga[1] + m.bocaManga * Math.cos(a),
  ];
  const axila: Ponto = [m.largura / 2, m.alturaCava];

  return [
    centroGola,
    ...curva(centroGola, [ladoGola[0], centroGola[1]], ladoGola),
    ombro,
    pontaManga,
    baixoManga,
    axila,
    [m.largura / 2, m.comprimento],
    [0, m.comprimento],
  ];
}

/** Contorno estimado só com largura e comprimento: gola, ombro e manga vêm do 06. */
export function formaIlustrativa(medida: MedidaTabela): Forma {
  const m = estimarMedidas(medida);
  return {
    comprimento: m.comprimento,
    largura: m.largura,
    larguraGola: m.larguraGola,
    profundidadeGola: m.profundidadeGola,
    alturaCava: m.alturaCava,
    metade: metadeDireita(m),
  };
}

export function arquivoCamiseta(tamanho: TamanhoCamiseta): string {
  return `camiseta-${tamanho}-ilustrativa.glb`;
}

export function gabaritoCamiseta(tamanho: TamanhoCamiseta): Faixa[] {
  return gabaritoEntre(TAMANHOS_CAMISETA, (t) => formaIlustrativa(TABELA_CAMISETA[t]), tamanho);
}
