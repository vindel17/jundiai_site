import type { Ponto } from "../glb";
import { pixelsDaBorda, type Mascara } from "./mascara";

/** Os 8 vizinhos em sentido horário na tela (y para baixo), começando pelo oeste. */
const VIZINHOS: Ponto[] = [
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
];

export function encostaNaBorda({ largura, altura, dados }: Mascara): boolean {
  return pixelsDaBorda(largura, altura).some((i) => dados[i] === 1);
}

type Passo = { x: number; y: number; vindo: number };

/**
 * Contorno externo da peça (pixels da borda, em ordem), pelo método de
 * Moore: anda pela beirada sempre com o fundo à esquerda.
 */
export function tracarContorno({ largura, altura, dados }: Mascara): Ponto[] {
  const primeiro = dados.indexOf(1);
  if (primeiro < 0) return [];
  const dentro = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < largura && y < altura && dados[y * largura + x] === 1;

  const seguinte = ({ x, y, vindo }: Passo): Passo | null => {
    for (let k = 1; k <= 8; k++) {
      const d = (vindo + k) % 8;
      const nx = x + VIZINHOS[d][0];
      const ny = y + VIZINHOS[d][1];
      if (!dentro(nx, ny)) continue;
      const anterior = VIZINHOS[(d + 7) % 8];
      const bx = x + anterior[0] - nx;
      const by = y + anterior[1] - ny;
      return { x: nx, y: ny, vindo: VIZINHOS.findIndex(([vx, vy]) => vx === bx && vy === by) };
    }
    return null;
  };

  const inicio: Passo = { x: primeiro % largura, y: Math.floor(primeiro / largura), vindo: 0 };
  const pontos: Ponto[] = [[inicio.x, inicio.y]];
  let atual = seguinte(inicio);
  const limite = 4 * largura * altura;
  while (atual && pontos.length < limite) {
    if (atual.x === inicio.x && atual.y === inicio.y) {
      const depois = seguinte(atual);
      const segundo = pontos[1];
      if (!depois || !segundo || (depois.x === segundo[0] && depois.y === segundo[1])) break;
    }
    pontos.push([atual.x, atual.y]);
    atual = seguinte(atual);
  }
  return pontos;
}
