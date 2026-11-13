import { CARTAO_CM } from "@/lib/gabarito/cartao/achar";
import type { PontoDaCamiseta } from "@/lib/gabarito/cartao/camiseta";
import type { PontoDaCintura } from "@/lib/gabarito/cartao/cintura";
import type { Quadrilatero } from "@/lib/gabarito/cartao/homografia";
import type { Pontos } from "@/lib/gabarito/cartao/receita";

/**
 * Posição inicial das marcas quando a foto não foi lida sozinha: uma peça
 * no meio da foto, para a pessoa arrastar cada ponto ao lugar.
 */
export function camisetaPadrao(largura: number, altura: number): Pontos<PontoDaCamiseta> {
  const [cx, cy] = [largura / 2, altura / 2];
  const u = Math.min(largura, altura) / 10;
  return {
    ombroEsq: [cx - 0.7 * u, cy - 3 * u],
    ombroDir: [cx + 0.7 * u, cy - 3 * u],
    axilaEsq: [cx - 2.2 * u, cy - 1.2 * u],
    axilaDir: [cx + 2.2 * u, cy - 1.2 * u],
    barra: [cx, cy + 3 * u],
  };
}

export function cinturaPadrao(largura: number, altura: number): Pontos<PontoDaCintura> {
  const [cx, cy] = [largura / 2, altura / 2];
  const u = Math.min(largura, altura) / 10;
  return {
    cosEsq: [cx - 1.6 * u, cy - 3 * u],
    cosDir: [cx + 1.6 * u, cy - 3 * u],
    quadrilEsq: [cx - 2.2 * u, cy - 0.5 * u],
    quadrilDir: [cx + 2.2 * u, cy - 0.5 * u],
  };
}

/** Um cartão deitado perto do meio da foto, já na proporção certa. */
export function cartaoPadrao(largura: number, altura: number): Quadrilatero {
  const [cx, cy] = [largura / 2, altura / 2 - Math.min(largura, altura) / 6];
  const a = Math.max(largura, altura) / 16;
  const b = (a * CARTAO_CM.altura) / CARTAO_CM.largura;
  return [[cx - a, cy - b], [cx + a, cy - b], [cx + a, cy + b], [cx - a, cy + b]];
}
