import type { Imagem } from "../molde/mascara";

/** Cada pixel da saída é a média de um bloco de `fator` por `fator`. Sobras à direita e embaixo ficam de fora. */
export function reduzir({ largura, altura, dados }: Imagem, fator: number): Imagem {
  const l = Math.floor(largura / fator);
  const a = Math.floor(altura / fator);
  const saida = new Uint8ClampedArray(l * a * 4);
  const area = fator * fator;
  for (let y = 0; y < a; y++) {
    for (let x = 0; x < l; x++) {
      let [r, g, b] = [0, 0, 0];
      for (let dy = 0; dy < fator; dy++) {
        let i = ((y * fator + dy) * largura + x * fator) * 4;
        for (let dx = 0; dx < fator; dx++, i += 4) {
          r += dados[i];
          g += dados[i + 1];
          b += dados[i + 2];
        }
      }
      saida.set([r / area, g / area, b / area, 255], (y * l + x) * 4);
    }
  }
  return { largura: l, altura: a, dados: saida };
}

/** Cor em qualquer ponto da foto, misturando os 4 pixels vizinhos. O centro de cada pixel fica na coordenada inteira. */
export function amostrar({ largura, altura, dados }: Imagem, x: number, y: number): [number, number, number] {
  const cx = Math.min(Math.max(x, 0), largura - 1);
  const cy = Math.min(Math.max(y, 0), altura - 1);
  const x0 = Math.min(Math.floor(cx), largura - 2);
  const y0 = Math.min(Math.floor(cy), altura - 2);
  const [fx, fy] = [cx - x0, cy - y0];
  const i = (y0 * largura + x0) * 4;
  const j = i + largura * 4;
  const canal = (c: number) =>
    (dados[i + c] * (1 - fx) + dados[i + 4 + c] * fx) * (1 - fy) +
    (dados[j + c] * (1 - fx) + dados[j + 4 + c] * fx) * fy;
  return [canal(0), canal(1), canal(2)];
}
