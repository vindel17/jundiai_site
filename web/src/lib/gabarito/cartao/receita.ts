import type { Ponto } from "../glb";
import { CARTAO_CM } from "./achar";
import { homografia, type Quadrilatero } from "./homografia";

/** Pontos de medida de uma peça, em pixels da foto, pelo nome de cada um. */
export type Pontos<P extends string = string> = Record<P, Ponto>;

export type Medidas = {
  /** As duas medidas da peça, em cm, na ordem da grade de tamanhos dela */
  valores: [number, number];
  /** Do centro do cartão ao centro da região medida, em cm */
  cartaoDoCentro: number;
};

/** Como medir um tipo de peça: onde ficam os pontos e que contas fazer com eles. */
export type Receita<P extends string = string> = {
  /** Como a peça aparece nos avisos, depois de "a": "camiseta", "bermuda ou calça" */
  nome: string;
  /** Onde o cartão deve ficar, para completar "coloque o cartão…" */
  lugarDoCartao: string;
  /**
   * Acha os pontos de medida na beirada da peça, em pixels. Quando não
   * acha, devolve o motivo em palavras para quem tirou a foto.
   */
  acharPontos(contorno: Ponto[]): Pontos<P> | string;
  /**
   * Reposiciona os pontos que dependem do tamanho real, que só o cartão
   * dá. `movido` é o ponto que a pessoa acabou de arrastar, se houver.
   */
  ajustar?(pontos: Pontos<P>, cartao: Quadrilatero, contorno: Ponto[] | null, movido?: P): Pontos<P>;
  /** `null` quando os pontos ou os cantos do cartão não permitem medir. */
  medir(pontos: Pontos<P>, cartao: Quadrilatero): Medidas | null;
};

export const distancia = (a: Ponto, b: Ponto) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const meio = (a: Ponto, b: Ponto): Ponto => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Os cantos do cartão no tamanho verdadeiro, em cm, na mesma sequência dos cantos da foto. */
function cartaoEmCm(cantos: Quadrilatero): Quadrilatero {
  const deitado = distancia(cantos[0], cantos[1]) >= distancia(cantos[1], cantos[2]);
  const [a, b] = deitado ? [CARTAO_CM.largura, CARTAO_CM.altura] : [CARTAO_CM.altura, CARTAO_CM.largura];
  return [[0, 0], [a, 0], [a, b], [0, b]];
}

/**
 * O cartão dá a escala e desfaz a inclinação da câmera: leva pontos da
 * foto (pixels) para a mesa (cm) e de volta. `null` quando os cantos não
 * formam um quadrilátero.
 */
export function escalaDoCartao(cartao: Quadrilatero) {
  const real = cartaoEmCm(cartao);
  const paraCm = homografia(cartao, real);
  const paraFoto = homografia(real, cartao);
  return paraCm && paraFoto ? { paraCm, paraFoto } : null;
}
