import type { Ponto } from "../glb";

/** Quatro cantos em sequência, dando a volta. */
export type Quadrilatero = [Ponto, Ponto, Ponto, Ponto];

/** Resolve A·x = b por eliminação de Gauss com pivô parcial. `null` se não há solução única. */
function resolver(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let pivo = i;
    for (let l = i + 1; l < n; l++) if (Math.abs(a[l][i]) > Math.abs(a[pivo][i])) pivo = l;
    if (Math.abs(a[pivo][i]) < 1e-12) return null;
    [a[i], a[pivo]] = [a[pivo], a[i]];
    [b[i], b[pivo]] = [b[pivo], b[i]];
    for (let l = i + 1; l < n; l++) {
      const q = a[l][i] / a[i][i];
      for (let c = i; c < n; c++) a[l][c] -= q * a[i][c];
      b[l] -= q * b[i];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let soma = b[i];
    for (let c = i + 1; c < n; c++) soma -= a[i][c] * x[c];
    x[i] = soma / a[i][i];
  }
  return x;
}

/**
 * Transformação de perspectiva que leva os 4 pontos de `origem` aos 4 de
 * `destino`: é o que desfaz a inclinação da câmera sobre um plano. `null`
 * quando três dos pontos estão alinhados.
 */
export function homografia(origem: Quadrilatero, destino: Quadrilatero): ((p: Ponto) => Ponto) | null {
  // Centrar a origem deixa as contas estáveis com coordenadas de milhares de pixels.
  const cx = origem.reduce((s, p) => s + p[0], 0) / 4;
  const cy = origem.reduce((s, p) => s + p[1], 0) / 4;
  const a: number[][] = [];
  const b: number[] = [];
  origem.forEach(([px, py], i) => {
    const [x, y] = [px - cx, py - cy];
    const [u, v] = destino[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(u, v);
  });
  const h = resolver(a, b);
  if (!h) return null;
  return ([px, py]) => {
    const [x, y] = [px - cx, py - cy];
    const w = h[6] * x + h[7] * y + 1;
    return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
  };
}
