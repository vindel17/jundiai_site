import type { Ponto } from "../glb";
import { envoltoria } from "../molde/geometria";
import {
  corMediana,
  distanciaDaCor,
  encolher,
  mediana,
  rotularRegioes,
  type Imagem,
  type Mascara,
} from "../molde/mascara";
import type { Quadrilatero } from "./homografia";

/** Cartão no formato padrão ID-1 (banco, transporte, loja), em centímetros. */
export const CARTAO_CM = { largura: 8.56, altura: 5.398 };
const PROPORCAO = CARTAO_CM.largura / CARTAO_CM.altura;

/** Diferença mínima de cor para o pixel não ser tecido, de 0 a 255. */
const CONTRASTE_MINIMO = 25;
/** Quantos desvios típicos da cor do tecido já contam como "outra coisa". */
const DESVIOS = 5;
/**
 * Tamanho aceito da mancha, como fração da área da peça. Numa calça de
 * adulto o cartão ocupa perto de 1%; numa bermuda tamanho 4, uns 6%.
 */
const AREA_MINIMA = 0.003;
const AREA_MAXIMA = 0.12;
/** Quanto a proporção pode fugir da do cartão: a foto inclinada deforma um pouco. */
const FOLGA_PROPORCAO = 0.25;
/** Fração mínima do retângulo ocupada pela mancha. */
const PREENCHIMENTO_MINIMO = 0.75;
const AMOSTRA_MAXIMA = 20000;

function indicesDe({ dados }: Mascara): number[] {
  const todos: number[] = [];
  dados.forEach((v, i) => v && todos.push(i));
  const passo = Math.ceil(todos.length / AMOSTRA_MAXIMA) || 1;
  return todos.filter((_, k) => k % passo === 0);
}

/** Marca o que está dentro da peça e não tem a cor do tecido: cartão, estampa, etiqueta. */
function foraDaCorDoTecido(imagem: Imagem, peca: Mascara): Mascara {
  // A beirada da peça mistura tecido e chão; fica de fora.
  const miolo = encolher(peca, Math.max(2, Math.round(peca.largura * 0.004)));
  const indices = indicesDe(miolo);
  const distancia = distanciaDaCor(imagem, corMediana(imagem, indices));
  const valores = indices.map((i) => distancia[i]);
  const centro = mediana(valores);
  const desvio = mediana(valores.map((v) => Math.abs(v - centro)));
  const limiar = Math.max(CONTRASTE_MINIMO, centro + DESVIOS * desvio);
  return { ...miolo, dados: miolo.dados.map((v, i) => (v && distancia[i] > limiar ? 1 : 0)) };
}

/** Menor retângulo, em qualquer ângulo, que cobre os pontos. Um dos lados sempre encosta na envoltória. */
function retanguloMinimo(pontos: Ponto[]): { cantos: Quadrilatero; lados: [number, number] } | null {
  const cx = pontos.reduce((s, p) => s + p[0], 0) / pontos.length;
  const cy = pontos.reduce((s, p) => s + p[1], 0) / pontos.length;
  const casco = envoltoria(pontos)
    .map((i) => pontos[i])
    .sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));

  let melhor: { cantos: Quadrilatero; lados: [number, number] } | null = null;
  for (let k = 0; k < casco.length; k++) {
    const [a, b] = [casco[k], casco[(k + 1) % casco.length]];
    const tamanho = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!tamanho) continue;
    const [ux, uy] = [(b[0] - a[0]) / tamanho, (b[1] - a[1]) / tamanho];
    const ao = casco.map(([x, y]) => x * ux + y * uy);
    const atraves = casco.map(([x, y]) => y * ux - x * uy);
    // Meio pixel a mais de cada lado: os pontos são centros de pixel.
    const [u0, u1] = [Math.min(...ao) - 0.5, Math.max(...ao) + 0.5];
    const [n0, n1] = [Math.min(...atraves) - 0.5, Math.max(...atraves) + 0.5];
    if (melhor && (u1 - u0) * (n1 - n0) >= melhor.lados[0] * melhor.lados[1]) continue;
    const canto = (u: number, n: number): Ponto => [u * ux - n * uy, u * uy + n * ux];
    melhor = {
      cantos: [canto(u0, n0), canto(u1, n0), canto(u1, n1), canto(u0, n1)],
      lados: [u1 - u0, n1 - n0],
    };
  }
  return melhor;
}

/**
 * Procura o cartão em cima da peça: a mancha de outra cor que tem
 * formato de retângulo na proporção do cartão. Devolve os cantos
 * aproximados, em pixels de `imagem`, ou `null` se não achar.
 */
export function acharCartao(imagem: Imagem, peca: Mascara): Quadrilatero | null {
  const manchas = foraDaCorDoTecido(imagem, peca);
  const { rotulos, tamanhos } = rotularRegioes(manchas);
  const areaPeca = peca.dados.reduce((s, v) => s + v, 0);
  const candidatas = new Map<number, Ponto[]>();
  tamanhos.forEach((tamanho, rotulo) => {
    if (rotulo && tamanho >= AREA_MINIMA * areaPeca && tamanho <= AREA_MAXIMA * areaPeca) {
      candidatas.set(rotulo, []);
    }
  });
  rotulos.forEach((rotulo, i) => {
    candidatas.get(rotulo)?.push([i % peca.largura, Math.floor(i / peca.largura)]);
  });

  let melhor: { cantos: Quadrilatero; nota: number } | null = null;
  for (const pontos of candidatas.values()) {
    const retangulo = retanguloMinimo(pontos);
    if (!retangulo) continue;
    const [a, b] = retangulo.lados;
    const fuga = Math.abs(Math.max(a, b) / Math.min(a, b) / PROPORCAO - 1);
    const preenchimento = pontos.length / (a * b);
    if (fuga > FOLGA_PROPORCAO || preenchimento < PREENCHIMENTO_MINIMO) continue;
    const nota = preenchimento - fuga;
    if (!melhor || nota > melhor.nota) melhor = { cantos: retangulo.cantos, nota };
  }
  return melhor?.cantos ?? null;
}
