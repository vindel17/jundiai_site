import type { Forma } from "../forma";
import type { Ponto } from "../glb";
import { encostaNaBorda, tracarContorno } from "./contorno";
import { areaComSinal, reamostrar, simplificar, trecho } from "./geometria";
import { separarPeca, type Imagem } from "./mascara";
import { acharPontos, type PontosCamiseta } from "./pontos";

/** Medidas da peça fotografada, em cm: largura na costura da axila e comprimento do ombro à barra. */
export type MedidasInformadas = { largura: number; comprimento: number };

export type ResultadoMolde =
  | {
      forma: Forma;
      /** Diferença entre a escala dada pela largura e a dada pelo comprimento (0,05 = 5%) */
      divergencia: number;
      /** Para conferência na foto, em pixels */
      contornoFoto: Ponto[];
      marcasFoto: Ponto[];
    }
  | { erro: string };

/** Desvios menores que isso somem do contorno: dobrinhas e ondulações do tecido. */
const TOLERANCIA_CM = 0.5;
/** Pontos por trecho na média dos dois lados: gola, ombro até axila (manga), axila até barra. */
const AMOSTRAS = [24, 120, 80];
const AREA_MINIMA = 0.03;

type Pontos = PontosCamiseta & { barra: number };

/** Centro da barra: o ponto mais baixo perto do eixo da peça. */
function acharBarra(pontos: Ponto[]): number {
  const xs = pontos.map((p) => p[0]);
  const faixa = 0.03 * (Math.max(...xs) - Math.min(...xs));
  let barra = -1;
  pontos.forEach(([x, y], i) => {
    if (Math.abs(x) < faixa && (barra < 0 || y > pontos[barra][1])) barra = i;
  });
  return barra;
}

/**
 * Endireita a peça pelas axilas, põe o eixo no meio delas e converte para cm:
 * a largura informada dá a escala horizontal; o comprimento, a vertical.
 */
function emCentimetros(contorno: Ponto[], p: PontosCamiseta, medidas: MedidasInformadas) {
  const [ae, ad] = [contorno[p.axilaEsq], contorno[p.axilaDir]];
  const angulo = -Math.atan2(ad[1] - ae[1], ad[0] - ae[0]);
  const [cx, cy] = [(ae[0] + ad[0]) / 2, (ae[1] + ad[1]) / 2];
  const [cos, sen] = [Math.cos(angulo), Math.sin(angulo)];
  const girado = contorno.map(([x, y]): Ponto => {
    const [dx, dy] = [x - cx, y - cy];
    return [dx * cos - dy * sen, dx * sen + dy * cos];
  });

  const barra = acharBarra(girado);
  const yOmbro = (girado[p.ombroEsq][1] + girado[p.ombroDir][1]) / 2;
  const escalaX = medidas.largura / Math.abs(girado[p.axilaDir][0] - girado[p.axilaEsq][0]);
  const escalaY = medidas.comprimento / (girado[barra][1] - yOmbro);
  return {
    pontos: girado.map(([x, y]): Ponto => [x * escalaX, (y - yOmbro) * escalaY]),
    barra,
    divergencia: Math.abs(escalaX / escalaY - 1),
  };
}

function espelhar(pontos: Ponto[]): Ponto[] {
  return pontos.map(([x, z]): Ponto => [-x, z]).reverse();
}

/** Média do lado direito com o esquerdo espelhado, trecho a trecho entre os pontos de medida. */
function formaSimetrica(c: Ponto[], p: Pontos, medidas: MedidasInformadas): Forma {
  const direita = [
    trecho(c, p.golaCentro, p.ombroDir),
    trecho(c, p.ombroDir, p.axilaDir),
    trecho(c, p.axilaDir, p.barra),
  ];
  const esquerda = [
    espelhar(trecho(c, p.ombroEsq, p.golaCentro)),
    espelhar(trecho(c, p.axilaEsq, p.ombroEsq)),
    espelhar(trecho(c, p.barra, p.axilaEsq)),
  ];
  const partes = direita.map((lado, k) => {
    const a = reamostrar(lado, AMOSTRAS[k]);
    const b = reamostrar(esquerda[k], AMOSTRAS[k]);
    return a.map(([x, z], i): Ponto => [(x + b[i][0]) / 2, (z + b[i][1]) / 2]);
  });
  partes[0][0] = [0, partes[0][0][1]];
  partes[2][partes[2].length - 1] = [0, medidas.comprimento];

  const [gola, manga, lateral] = partes.map((parte) => simplificar(parte, TOLERANCIA_CM));
  const ombro = gola[gola.length - 1];
  const axila = manga[manga.length - 1];
  return {
    comprimento: medidas.comprimento,
    largura: medidas.largura,
    larguraGola: ombro[0] * 2,
    profundidadeGola: gola[0][1],
    alturaCava: axila[1],
    metade: [...gola, ...manga.slice(1), ...lateral.slice(1)],
  };
}

/** Gera o molde simplificado e simétrico a partir da foto da camiseta estendida de frente. */
export function moldeDaFoto(imagem: Imagem, medidas: MedidasInformadas): ResultadoMolde {
  const mascara = separarPeca(imagem);
  const area = mascara.dados.reduce((s, v) => s + v, 0) / mascara.dados.length;
  if (area < AREA_MINIMA) {
    return { erro: "Não encontrei a camiseta na foto. Use um fundo liso que contraste bem com o tecido." };
  }
  if (encostaNaBorda(mascara)) {
    return { erro: "A camiseta encosta na borda da foto. Afaste o celular para ela caber inteira, com folga." };
  }

  let contorno = tracarContorno(mascara);
  if (areaComSinal(contorno) < 0) contorno = contorno.reverse();
  const pontos = acharPontos(contorno);
  if (!pontos) {
    return {
      erro: "Não achei a gola e as duas axilas. Confira se a camiseta está de frente, com as mangas abertas, e se o fundo contrasta com o tecido.",
    };
  }

  const cm = emCentimetros(contorno, pontos, medidas);
  if (cm.barra < 0) return { erro: "Não achei a barra da camiseta na foto." };
  const marcas = [pontos.golaCentro, pontos.ombroEsq, pontos.ombroDir, pontos.axilaEsq, pontos.axilaDir, cm.barra];
  return {
    forma: formaSimetrica(cm.pontos, { ...pontos, barra: cm.barra }, medidas),
    divergencia: cm.divergencia,
    contornoFoto: contorno,
    marcasFoto: marcas.map((i) => contorno[i]),
  };
}
