import type { Forma } from "../forma";
import type { Ponto } from "../glb";
import { contornoCompleto } from "../molde/foto-teste";
import type { PontoDaCamiseta } from "./camiseta";
import { ALTURA_DO_QUADRIL, type PontoDaCintura } from "./cintura";

/** Apoio para os testes: o desenho de cada peça, em cm, e onde ficam de verdade os pontos de medida. */
export type PecaDeTeste<P extends string = string> = { contorno: Ponto[]; marcas: Record<P, Ponto> };

const espelho = ([x, z]: Ponto): Ponto => [-x, z];

/** `manga` estica as mangas, em cm, para virar camiseta de manga longa. */
export function pecaCamiseta(forma: Forma, manga = 0): PecaDeTeste<PontoDaCamiseta> {
  const metade = [...forma.metade];
  // Os dois pontos antes da axila são a ponta de cima e a de baixo da manga.
  const axila = metade.length - 3;
  const [ombro, ponta] = [metade[axila - 3], metade[axila - 2]];
  const tamanho = Math.hypot(ponta[0] - ombro[0], ponta[1] - ombro[1]);
  for (const i of [axila - 2, axila - 1]) {
    metade[i] = [
      metade[i][0] + ((ponta[0] - ombro[0]) / tamanho) * manga,
      metade[i][1] + ((ponta[1] - ombro[1]) / tamanho) * manga,
    ];
  }
  const ladoDaGola: Ponto = [forma.larguraGola / 2, 0];
  const naAxila: Ponto = [forma.largura / 2, forma.alturaCava];
  return {
    contorno: contornoCompleto({ ...forma, metade }),
    marcas: {
      ombroEsq: espelho(ladoDaGola),
      ombroDir: ladoDaGola,
      axilaEsq: espelho(naAxila),
      axilaDir: naAxila,
      barra: [0, forma.comprimento],
    },
  };
}

type Calca = {
  /** De uma ponta à outra do cós */
  cintura: number;
  /** Largura 20 cm abaixo do cós */
  quadril: number;
  /** Do cós à barra */
  comprimento: number;
  /** Do cós ao encontro das pernas */
  gancho: number;
  /** Largura de cada perna na barra */
  boca: number;
  /** Vão entre as pernas na barra */
  vao?: number;
};

/** Bermuda ou calça de frente, com o cós para cima. A origem é o meio do cós. */
export function pecaCalca({ cintura, quadril, comprimento, gancho, boca, vao = 3 }: Calca): PecaDeTeste<PontoDaCintura> {
  const [c, q, h] = [cintura / 2, quadril / 2, vao / 2 + boca];
  return {
    contorno: [
      [-c, 0],
      [c, 0],
      [q, ALTURA_DO_QUADRIL],
      [h, comprimento],
      [vao / 2, comprimento],
      [0, gancho],
      [-vao / 2, comprimento],
      [-h, comprimento],
      [-q, ALTURA_DO_QUADRIL],
    ],
    marcas: {
      cosEsq: [-c, 0],
      cosDir: [c, 0],
      quadrilEsq: [-q, ALTURA_DO_QUADRIL],
      quadrilDir: [q, ALTURA_DO_QUADRIL],
    },
  };
}
