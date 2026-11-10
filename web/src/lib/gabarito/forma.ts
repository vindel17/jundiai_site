import {
  CORES,
  contornoTracejado,
  deslocarParaDentro,
  polilinha,
  segmento,
  tracejado,
} from "./desenho";
import type { Faixa, Ponto } from "./glb";
import { marcaAlinhamento } from "./marcas";

/**
 * Contorno da camiseta estendida, de frente, em centímetros. Origem no
 * centro, na altura do ponto mais alto do ombro (junto à gola); z cresce
 * em direção à barra.
 */
export type Forma = {
  comprimento: number;
  /** De axila a axila */
  largura: number;
  larguraGola: number;
  profundidadeGola: number;
  /** Do ponto mais alto do ombro até a altura da axila */
  alturaCava: number;
  /** Metade direita, do centro da gola (x = 0) ao centro da barra (x = 0) */
  metade: Ponto[];
};

const ESPESSURA_CONTORNO = 0.004;
const ESPESSURA_VIZINHO = 0.004;
/** Escolhido acima dos vizinhos, para a linha vermelha não piscar onde se cruzam. */
const ALTURA_ESCOLHIDO = 0.0015;

function emMetros([x, z]: Ponto): Ponto {
  return [x / 100, z / 100];
}

/** Contorno fechado em metros, deslocado para a borda externa da linha cair na medida. */
function contornoEmMetros(forma: Forma, espessura: number): Ponto[] {
  const esquerda = forma.metade
    .slice(1, -1)
    .reverse()
    .map(([x, z]): Ponto => [-x, z]);
  return deslocarParaDentro([...forma.metade, ...esquerda].map(emMetros), espessura / 2);
}

/** Linha amarela tracejada no centro, interrompida na axila e antes da marca interna. */
function linhaCentral(forma: Forma, zMarcaInterna?: number): Faixa[] {
  const inicio = (forma.profundidadeGola + 1) / 100;
  const fim = Math.min((forma.comprimento - 2) / 100, (zMarcaInterna ?? Infinity) - 0.02);
  const cava = forma.alturaCava / 100;
  const lacuna = (z: number) => (z - inicio) / (fim - inicio);
  return tracejado([0, inicio], [0, fim], 0.02, 0.02, 0.002, CORES.amarelo, [
    [lacuna(cava - 0.015), lacuna(cava + 0.015)],
  ]);
}

function naAltura(faixas: Faixa[], altura: number): Faixa[] {
  return faixas.map((f) => ({ ...f, altura }));
}

function contornoVizinho(forma: Forma | undefined, cor: Faixa["cor"]): Faixa[] {
  if (!forma) return [];
  const contorno = contornoEmMetros(forma, ESPESSURA_VIZINHO);
  return contornoTracejado(contorno, 0.02, 0.015, ESPESSURA_VIZINHO, cor);
}

function gabaritoDaForma(atual: Forma, menor?: Forma, maior?: Forma): Faixa[] {
  const meia = atual.largura / 200;
  const cava = atual.alturaCava / 100;
  const gola = atual.larguraGola / 200;
  const escolhido = [
    ...polilinha(contornoEmMetros(atual, ESPESSURA_CONTORNO), ESPESSURA_CONTORNO, CORES.vermelho, true),
    segmento([-(meia - ESPESSURA_CONTORNO), cava], [meia - ESPESSURA_CONTORNO, cava], 0.002, CORES.vermelho),
  ];
  return [
    ...contornoVizinho(menor, CORES.magenta),
    ...contornoVizinho(maior, CORES.verde),
    ...naAltura(escolhido, ALTURA_ESCOLHIDO),
    ...linhaCentral(atual, menor ? menor.comprimento / 100 : undefined),
    marcaAlinhamento(gola, 0),
    marcaAlinhamento(-gola, 0),
  ];
}

/**
 * Gabarito com três tamanhos um dentro do outro, alinhados pela gola: o
 * escolhido em vermelho contínuo, o menor em magenta tracejado (contrasta
 * com camiseta azul) e o maior em verde tracejado. A borda externa de cada
 * linha é a medida do tamanho.
 */
export function gabaritoEntre<T extends string>(
  tamanhos: readonly T[],
  forma: (tamanho: T) => Forma,
  tamanho: T,
): Faixa[] {
  const indice = tamanhos.indexOf(tamanho);
  const vizinho = (t: T | undefined) => (t ? forma(t) : undefined);
  return gabaritoDaForma(forma(tamanho), vizinho(tamanhos[indice - 1]), vizinho(tamanhos[indice + 1]));
}

const CAMPOS_FORMA = ["comprimento", "largura", "larguraGola", "profundidadeGola", "alturaCava"] as const;

function medidaValida(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 300;
}

function pontoValido(p: unknown): p is Ponto {
  return Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === "number" && Number.isFinite(v));
}

/** Confere uma forma vinda de fora (arquivo de moldes ou formulário). */
export function validarForma(valor: unknown): Forma | null {
  if (!valor || typeof valor !== "object") return null;
  const f = valor as Record<string, unknown>;
  if (!CAMPOS_FORMA.every((campo) => medidaValida(f[campo]))) return null;
  const metade = f.metade;
  if (!Array.isArray(metade) || metade.length < 4 || metade.length > 500) return null;
  if (!metade.every(pontoValido)) return null;
  return {
    comprimento: f.comprimento as number,
    largura: f.largura as number,
    larguraGola: f.larguraGola as number,
    profundidadeGola: f.profundidadeGola as number,
    alturaCava: f.alturaCava as number,
    metade: metade.map(([x, z]): Ponto => [x, z]),
  };
}
