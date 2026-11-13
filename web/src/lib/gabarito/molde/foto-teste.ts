import type { Forma } from "../forma";
import type { Ponto } from "../glb";

/** Apoio para os testes que desenham fotos de mentira. Não é usado pelo site. */

/** Sorteio repetível, para o teste dar sempre o mesmo resultado. */
export function sorteio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function contornoCompleto({ metade }: Forma): Ponto[] {
  return [...metade, ...metade.slice(1, -1).reverse().map(([x, z]): Ponto => [-x, z])];
}

export function dentro([x, y]: Ponto, poligono: Ponto[]): boolean {
  let resultado = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i];
    const [xj, yj] = poligono[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) resultado = !resultado;
  }
  return resultado;
}
