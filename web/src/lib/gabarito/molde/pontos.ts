import type { Ponto } from "../glb";
import { reentrancias, type Reentrancia } from "./geometria";

/** Índices, no contorno, dos pontos usados para medir a camiseta. */
export type PontosCamiseta = {
  /** Fundo da gola, no centro */
  golaCentro: number;
  /** Pontos mais altos do ombro, junto à gola */
  ombroEsq: number;
  ombroDir: number;
  axilaEsq: number;
  axilaDir: number;
};

/** Frações da largura total da peça. A gola de trás aparece rasa na foto. */
const PROFUNDIDADE_MINIMA_GOLA = 0.004;
const PROFUNDIDADE_MINIMA_AXILA = 0.03;

/** O topo do ombro sai como uma faixa reta de pixels; o ponto certo é a ponta junto à gola. */
function juntoAGola(contorno: Ponto[], vertice: number, passo: 1 | -1, golaCentro: number): number {
  const n = contorno.length;
  const y = contorno[vertice][1];
  let i = vertice;
  for (let proximo = (i + passo + n) % n; proximo !== golaCentro; proximo = (proximo + passo + n) % n) {
    if (Math.abs(contorno[proximo][1] - y) > 1) break;
    i = proximo;
  }
  return i;
}

function maisFunda(lista: Reentrancia[]): Reentrancia | undefined {
  return lista.reduce<Reentrancia | undefined>(
    (melhor, r) => (!melhor || r.profundidade > melhor.profundidade ? r : melhor),
    undefined,
  );
}

/**
 * Acha gola, ombros e axilas de uma camiseta de frente, com as mangas
 * abertas: a gola é a reentrância rasa no topo, no meio; as axilas são as
 * reentrâncias fundas de cada lado, entre a manga e a lateral do corpo.
 */
export function acharPontos(contorno: Ponto[]): PontosCamiseta | null {
  const xs = contorno.map((p) => p[0]);
  const ys = contorno.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const largura = x1 - x0;
  const altura = y1 - y0;
  const meio = (x0 + x1) / 2;
  const todas = reentrancias(contorno);
  const fundo = (r: Reentrancia) => contorno[r.fundo];

  const gola = maisFunda(
    todas.filter(
      (r) =>
        r.profundidade > PROFUNDIDADE_MINIMA_GOLA * largura &&
        fundo(r)[1] < y0 + 0.3 * altura &&
        Math.abs(fundo(r)[0] - meio) < 0.15 * largura,
    ),
  );
  if (!gola) return null;

  const axilas = todas.filter(
    (r) =>
      r !== gola &&
      r.profundidade > PROFUNDIDADE_MINIMA_AXILA * largura &&
      fundo(r)[1] > fundo(gola)[1] &&
      fundo(r)[1] < y0 + 0.8 * altura,
  );
  const axilaEsq = maisFunda(axilas.filter((r) => fundo(r)[0] < meio));
  const axilaDir = maisFunda(axilas.filter((r) => fundo(r)[0] > meio));
  if (!axilaEsq || !axilaDir) return null;

  const antes = juntoAGola(contorno, gola.inicio, 1, gola.fundo);
  const depois = juntoAGola(contorno, gola.fim, -1, gola.fundo);
  const esquerdaPrimeiro = contorno[antes][0] < contorno[depois][0];
  return {
    golaCentro: gola.fundo,
    ombroEsq: esquerdaPrimeiro ? antes : depois,
    ombroDir: esquerdaPrimeiro ? depois : antes,
    axilaEsq: axilaEsq.fundo,
    axilaDir: axilaDir.fundo,
  };
}
