import type { Ponto } from "../glb";

export function distanciaAteReta(p: Ponto, a: Ponto, b: Ponto): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const tamanho = Math.hypot(dx, dy);
  if (!tamanho) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dx * (a[1] - p[1]) - dy * (a[0] - p[0])) / tamanho;
}

/** Positiva quando o contorno anda em sentido horário na tela (y para baixo). */
export function areaComSinal(pontos: Ponto[]): number {
  let soma = 0;
  pontos.forEach(([x, y], i) => {
    const [px, py] = pontos[(i + 1) % pontos.length];
    soma += x * py - px * y;
  });
  return soma / 2;
}

/** Índices dos vértices da envoltória convexa, em ordem crescente. */
export function envoltoria(pontos: Ponto[]): number[] {
  const ordem = pontos
    .map((_, i) => i)
    .sort((i, j) => pontos[i][0] - pontos[j][0] || pontos[i][1] - pontos[j][1]);
  const cruz = (o: Ponto, a: Ponto, b: Ponto) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const metade = (lista: number[]) => {
    const casco: number[] = [];
    for (const i of lista) {
      while (
        casco.length >= 2 &&
        cruz(pontos[casco[casco.length - 2]], pontos[casco[casco.length - 1]], pontos[i]) <= 0
      ) {
        casco.pop();
      }
      casco.push(i);
    }
    casco.pop();
    return casco;
  };
  return [...new Set([...metade(ordem), ...metade([...ordem].reverse())])].sort((a, b) => a - b);
}

export type Reentrancia = {
  /** Vértices da envoltória nas pontas do trecho */
  inicio: number;
  fim: number;
  /** Ponto mais fundo do trecho */
  fundo: number;
  profundidade: number;
};

/** Trechos do contorno que afundam para dentro da envoltória (gola, axilas). */
export function reentrancias(pontos: Ponto[]): Reentrancia[] {
  const n = pontos.length;
  const casco = envoltoria(pontos);
  return casco.map((inicio, k) => {
    const fim = casco[(k + 1) % casco.length];
    const passos = (fim - inicio + n) % n || n;
    let fundo = inicio;
    let profundidade = 0;
    for (let s = 1; s < passos; s++) {
      const i = (inicio + s) % n;
      const d = distanciaAteReta(pontos[i], pontos[inicio], pontos[fim]);
      if (d > profundidade) {
        profundidade = d;
        fundo = i;
      }
    }
    return { inicio, fim, fundo, profundidade };
  });
}

/** Pedaço do contorno fechado de `de` até `ate` (inclusive), andando para frente. */
export function trecho(pontos: Ponto[], de: number, ate: number): Ponto[] {
  const saida: Ponto[] = [];
  for (let i = de; ; i = (i + 1) % pontos.length) {
    saida.push(pontos[i]);
    if (i === ate) return saida;
  }
}

/** Douglas–Peucker: tira os pontos que desviam menos que `tolerancia` da reta. Mantém as pontas. */
export function simplificar(pontos: Ponto[], tolerancia: number): Ponto[] {
  if (pontos.length < 3) return pontos;
  const manter = new Uint8Array(pontos.length);
  manter[0] = manter[pontos.length - 1] = 1;
  const pilha: [number, number][] = [[0, pontos.length - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop()!;
    let maior = 0;
    let indice = -1;
    for (let i = a + 1; i < b; i++) {
      const d = distanciaAteReta(pontos[i], pontos[a], pontos[b]);
      if (d > maior) {
        maior = d;
        indice = i;
      }
    }
    if (indice >= 0 && maior > tolerancia) {
      manter[indice] = 1;
      pilha.push([a, indice], [indice, b]);
    }
  }
  return pontos.filter((_, i) => manter[i]);
}

/** `quantidade` pontos igualmente espaçados ao longo da linha, incluindo as pontas. */
export function reamostrar(pontos: Ponto[], quantidade: number): Ponto[] {
  const acumulado = [0];
  for (let i = 1; i < pontos.length; i++) {
    const [a, b] = [pontos[i - 1], pontos[i]];
    acumulado.push(acumulado[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = acumulado[acumulado.length - 1];
  const saida: Ponto[] = [];
  let j = 0;
  for (let k = 0; k < quantidade; k++) {
    const s = (total * k) / (quantidade - 1);
    while (j < pontos.length - 2 && acumulado[j + 1] < s) j++;
    const [a, b] = [pontos[j], pontos[Math.min(j + 1, pontos.length - 1)]];
    const t = (s - acumulado[j]) / (acumulado[j + 1] - acumulado[j] || 1);
    saida.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return saida;
}
