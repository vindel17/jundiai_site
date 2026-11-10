import type { Faixa, Ponto } from "./glb";

type Cor = Faixa["cor"];

export const CORES = {
  vermelho: [0.85, 0.15, 0.15],
  azul: [0.1, 0.25, 0.75],
  amarelo: [0.95, 0.75, 0.05],
  verde: [0.1, 0.6, 0.25],
  magenta: [0.85, 0.1, 0.7],
} satisfies Record<string, Cor>;

export function retangulo(x0: number, z0: number, x1: number, z1: number, cor: Cor): Faixa {
  return { cantos: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], cor };
}

/** Linha centrada no segmento, com espessura em metros. */
export function linhaHorizontal(x0: number, x1: number, z: number, espessura: number, cor: Cor): Faixa {
  return retangulo(x0, z - espessura / 2, x1, z + espessura / 2, cor);
}

export function linhaVertical(x: number, z0: number, z1: number, espessura: number, cor: Cor): Faixa {
  return retangulo(x - espessura / 2, z0, x + espessura / 2, z1, cor);
}

/** Segmento em qualquer ângulo, centrado na reta entre `a` e `b`. */
export function segmento(a: Ponto, b: Ponto, espessura: number, cor: Cor): Faixa {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const tamanho = Math.hypot(dx, dz) || 1;
  const nx = (-dz / tamanho) * (espessura / 2);
  const nz = (dx / tamanho) * (espessura / 2);
  return {
    cantos: [
      [a[0] + nx, a[1] + nz],
      [b[0] + nx, b[1] + nz],
      [b[0] - nx, b[1] - nz],
      [a[0] - nx, a[1] - nz],
    ],
    cor,
  };
}

/**
 * Linha passando pelos pontos. Um quadradinho em cada vértice fecha a
 * emenda entre segmentos de ângulos diferentes.
 */
export function polilinha(pontos: Ponto[], espessura: number, cor: Cor, fechada = false): Faixa[] {
  const lista = fechada ? [...pontos, pontos[0]] : pontos;
  const faixas: Faixa[] = [];
  const e = espessura / 2;
  for (let i = 0; i < lista.length - 1; i++) {
    faixas.push(segmento(lista[i], lista[i + 1], espessura, cor));
  }
  for (const [x, z] of pontos) faixas.push(retangulo(x - e, z - e, x + e, z + e, cor));
  return faixas;
}

/**
 * Desloca um polígono fechado para dentro em `d` metros (junção em ponta).
 * Usado para que a borda externa da linha coincida com a medida real.
 */
export function deslocarParaDentro(pontos: Ponto[], d: number): Ponto[] {
  const p = pontos.filter((pt, i) => {
    const prox = pontos[(i + 1) % pontos.length];
    return Math.hypot(prox[0] - pt[0], prox[1] - pt[1]) > 1e-9;
  });
  let area = 0;
  p.forEach((a, i) => {
    const b = p[(i + 1) % p.length];
    area += a[0] * b[1] - b[0] * a[1];
  });
  const sinal = area > 0 ? 1 : -1;

  const normal = (a: Ponto, b: Ponto): Ponto => {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const t = Math.hypot(dx, dz);
    return [(sinal * -dz) / t, (sinal * dx) / t];
  };

  return p.map((pt, i) => {
    const n1 = normal(p[(i - 1 + p.length) % p.length], pt);
    const n2 = normal(pt, p[(i + 1) % p.length]);
    const mx = n1[0] + n2[0];
    const mz = n1[1] + n2[1];
    const m = Math.hypot(mx, mz) || 1;
    const cos = Math.max((mx / m) * n1[0] + (mz / m) * n1[1], 0.25);
    return [pt[0] + (mx / m) * (d / cos), pt[1] + (mz / m) * (d / cos)];
  });
}

/** Linha tracejada de `a` até `b`; pula os trechos dentro de `lacunas` (frações 0..1). */
export function tracejado(
  a: Ponto,
  b: Ponto,
  traco: number,
  espaco: number,
  espessura: number,
  cor: Cor,
  lacunas: [number, number][] = [],
): Faixa[] {
  const total = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const faixas: Faixa[] = [];
  const ponto = (f: number): Ponto => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  for (let s = 0; s < total; s += traco + espaco) {
    const f0 = s / total;
    const f1 = Math.min(s + traco, total) / total;
    if (lacunas.some(([l0, l1]) => f1 > l0 && f0 < l1)) continue;
    faixas.push(segmento(ponto(f0), ponto(f1), espessura, cor));
  }
  return faixas;
}

/** Contorno fechado tracejado: os traços seguem o caminho, inclusive nas curvas. */
export function contornoTracejado(
  pontos: Ponto[],
  traco: number,
  espaco: number,
  espessura: number,
  cor: Cor,
): Faixa[] {
  const caminho = [...pontos, pontos[0]];
  const inicios: number[] = [0];
  for (let i = 0; i < caminho.length - 1; i++) {
    const [a, b] = [caminho[i], caminho[i + 1]];
    inicios.push(inicios[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = inicios[inicios.length - 1];

  const pontoEm = (s: number, i: number): Ponto => {
    const [a, b] = [caminho[i], caminho[i + 1]];
    const t = (s - inicios[i]) / (inicios[i + 1] - inicios[i] || 1);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };

  const faixas: Faixa[] = [];
  const quantidade = Math.ceil(total / (traco + espaco));
  for (let k = 0; k < quantidade; k++) {
    const s0 = k * (traco + espaco);
    const s1 = Math.min(s0 + traco, total);
    for (let i = 0; i < caminho.length - 1; i++) {
      const a = Math.max(s0, inicios[i]);
      const b = Math.min(s1, inicios[i + 1]);
      if (b > a) faixas.push(segmento(pontoEm(a, i), pontoEm(b, i), espessura, cor));
    }
  }
  return faixas;
}

/** Curva de Bézier quadrática amostrada em `passos` trechos (sem o ponto inicial). */
export function curva(a: Ponto, controle: Ponto, b: Ponto, passos = 8): Ponto[] {
  const pontos: Ponto[] = [];
  for (let i = 1; i <= passos; i++) {
    const t = i / passos;
    const u = 1 - t;
    pontos.push([
      u * u * a[0] + 2 * u * t * controle[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * controle[1] + t * t * b[1],
    ]);
  }
  return pontos;
}

/** Contorno retangular com as linhas centradas nas bordas informadas. */
export function contorno(x0: number, z0: number, x1: number, z1: number, espessura: number, cor: Cor): Faixa[] {
  const e = espessura / 2;
  return [
    linhaHorizontal(x0 - e, x1 + e, z0, espessura, cor),
    linhaHorizontal(x0 - e, x1 + e, z1, espessura, cor),
    linhaVertical(x0, z0 + e, z1 - e, espessura, cor),
    linhaVertical(x1, z0 + e, z1 - e, espessura, cor),
  ];
}

/**
 * Quadrado de teste para conferir a escala com fita métrica:
 * borda vermelha de `ladoCm`, grade azul a cada 10 cm e um canto amarelo
 * marcando a origem. Medir sempre do centro de uma linha ao centro da outra.
 */
export function gradeTeste(ladoCm = 60): Faixa[] {
  const lado = ladoCm / 100;
  const metade = lado / 2;
  const borda = 0.004;
  const dentro = metade - borda / 2;
  const faixas: Faixa[] = [];

  for (let cm = 10; cm < ladoCm; cm += 10) {
    const p = -metade + cm / 100;
    faixas.push(linhaVertical(p, -dentro, dentro, 0.002, CORES.azul));
    faixas.push(linhaHorizontal(-dentro, dentro, p, 0.002, CORES.azul));
  }
  faixas.push(...contorno(-metade, -metade, metade, metade, borda, CORES.vermelho));
  faixas.push(retangulo(-dentro, -dentro, -metade + 0.04, -metade + 0.04, CORES.amarelo));

  return faixas;
}
