import type { Ponto } from "../glb";
import type { Imagem } from "../molde/mascara";
import { CARTAO_CM } from "./achar";
import type { Quadrilatero } from "./homografia";
import { amostrar } from "./imagem";

type Reta = { ponto: Ponto; direcao: Ponto };

/** Fração de cada ponta do lado que fica de fora: os cantos do cartão são arredondados. */
const PONTA = 0.14;
/** Distância, em pixels, entre um perfil e o seguinte ao longo do lado. */
const PASSO = 2;
/** Diferença mínima de cor entre o cartão e o tecido para o perfil valer (distância RGB). */
const CONTRASTE_MINIMO = 40;
/** Um ponto mais longe da reta que isso, em pixels, é descartado no ajuste. */
const DESVIO_MAXIMO = 1;
const PONTOS_MINIMOS = 8;
/** Quanto a proporção medida pode fugir da do cartão: 12% cobre uma foto inclinada em até uns 25 graus. */
const FOLGA_PROPORCAO = 0.12;

function distanciaDeCor(a: number[], b: number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Cor ao longo de uma linha que atravessa a borda, de fora para dentro, a cada pixel. */
function perfil(imagem: Imagem, centro: Ponto, normal: Ponto, tangente: Ponto, alcance: number): number[][] {
  const cores: number[][] = [];
  for (let t = -alcance; t <= alcance; t++) {
    const soma = [0, 0, 0];
    // Média de 3 pontos ao longo da borda, para a trama do tecido pesar menos.
    for (const s of [-1, 0, 1]) {
      const cor = amostrar(
        imagem,
        centro[0] + t * normal[0] + s * tangente[0],
        centro[1] + t * normal[1] + s * tangente[1],
      );
      cor.forEach((v, c) => (soma[c] += v / 3));
    }
    cores.push(soma);
  }
  return cores;
}

/** Posição, com fração, em que os valores passam de `alvo` perto do índice dado. */
function travessia(valores: number[], alvo: number, perto: number): number | null {
  let j = perto;
  while (j < valores.length && valores[j] < alvo) j++;
  while (j > 0 && valores[j - 1] >= alvo) j--;
  if (j === 0 || j === valores.length) return null;
  return j - 1 + (alvo - valores[j - 1]) / (valores[j] - valores[j - 1]);
}

/**
 * Acha a borda num perfil: o ponto em que a cor está a meio caminho entre
 * o tecido e o cartão, em pixels a partir do centro do perfil. `rampa` é
 * em quantos pixels a cor muda de uma para a outra: mede o desfoque.
 * `null` quando falta contraste nesse trecho.
 */
function cruzamento(cores: number[][]): { posicao: number; rampa: number } | null {
  const fora = [0, 1, 2].map((c) => (cores[0][c] + cores[1][c] + cores[2][c]) / 3);
  const afastamento = cores.map((cor) => distanciaDeCor(cor, fora));
  // Primeiro ponto, vindo de fora, em que a cor deixa de ser a do tecido e continua assim.
  const saida = afastamento.findIndex(
    (v, j) => v >= CONTRASTE_MINIMO && (afastamento[j + 1] ?? v) >= CONTRASTE_MINIMO,
  );
  if (saida < 1) return null;
  // Sobe até a cor parar de mudar: é a cor do cartão junto à borda.
  // Mais para dentro pode haver tarja ou desenho, que não entram na conta.
  let topo = saida;
  const sobe = (j: number) => Math.max(afastamento[j + 1] ?? 0, afastamento[j + 2] ?? 0) > afastamento[j] * 1.05;
  while (sobe(topo)) topo++;
  const nivel = afastamento[topo];

  const [quarto, meio, tresQuartos] = [0.25, 0.5, 0.75].map((f) => travessia(afastamento, f * nivel, saida));
  if (quarto === null || meio === null || tresQuartos === null) return null;
  return { posicao: meio - (cores.length - 1) / 2, rampa: 2 * (tresQuartos - quarto) };
}

/** Reta que melhor passa pelos pontos, descartando os que fogem dela. */
function ajustarReta(pontos: Ponto[]): Reta | null {
  let usados = pontos;
  let reta: Reta | null = null;
  for (let rodada = 0; rodada < 3; rodada++) {
    if (usados.length < PONTOS_MINIMOS) return null;
    const cx = usados.reduce((s, p) => s + p[0], 0) / usados.length;
    const cy = usados.reduce((s, p) => s + p[1], 0) / usados.length;
    let [sxx, sxy, syy] = [0, 0, 0];
    for (const [x, y] of usados) {
      sxx += (x - cx) ** 2;
      sxy += (x - cx) * (y - cy);
      syy += (y - cy) ** 2;
    }
    const angulo = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const atual: Reta = { ponto: [cx, cy], direcao: [Math.cos(angulo), Math.sin(angulo)] };
    reta = atual;
    const desvio = ([x, y]: Ponto) =>
      Math.abs((x - cx) * atual.direcao[1] - (y - cy) * atual.direcao[0]);
    const limite = Math.max(DESVIO_MAXIMO, 2.5 * [...usados.map(desvio)].sort((a, b) => a - b)[usados.length >> 1]);
    const dentro = usados.filter((p) => desvio(p) <= limite);
    if (dentro.length === usados.length) break;
    usados = dentro;
  }
  return usados.length >= Math.max(PONTOS_MINIMOS, pontos.length / 2) ? reta : null;
}

function cruzar(a: Reta, b: Reta): Ponto | null {
  const det = a.direcao[0] * b.direcao[1] - a.direcao[1] * b.direcao[0];
  if (Math.abs(det) < 1e-9) return null;
  const [dx, dy] = [b.ponto[0] - a.ponto[0], b.ponto[1] - a.ponto[1]];
  const t = (dx * b.direcao[1] - dy * b.direcao[0]) / det;
  return [a.ponto[0] + t * a.direcao[0], a.ponto[1] + t * a.direcao[1]];
}

/** Acha a borda em vários pontos ao longo de um lado do cartão e ajusta uma reta por eles. */
function retaDoLado(
  imagem: Imagem,
  a: Ponto,
  b: Ponto,
  centro: Ponto,
  alcance: number,
  rampas: number[],
): Reta | null {
  const tamanho = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!tamanho) return null;
  const tangente: Ponto = [(b[0] - a[0]) / tamanho, (b[1] - a[1]) / tamanho];
  const paraDentro = (centro[0] - a[0]) * -tangente[1] + (centro[1] - a[1]) * tangente[0] > 0 ? 1 : -1;
  const normal: Ponto = [-tangente[1] * paraDentro, tangente[0] * paraDentro];

  const pontos: Ponto[] = [];
  for (let s = PONTA * tamanho; s <= (1 - PONTA) * tamanho; s += PASSO) {
    const base: Ponto = [a[0] + s * tangente[0], a[1] + s * tangente[1]];
    const borda = cruzamento(perfil(imagem, base, normal, tangente, alcance));
    if (!borda) continue;
    pontos.push([base[0] + borda.posicao * normal[0], base[1] + borda.posicao * normal[1]]);
    rampas.push(borda.rampa);
  }
  return ajustarReta(pontos);
}

export type CartaoRefinado = {
  cantos: Quadrilatero;
  /** Em quantos pixels a cor passa do tecido para o cartão: quanto maior, mais desfocada a foto */
  rampa: number;
};

/**
 * Parte dos cantos aproximados e acha os cantos do cartão com precisão de
 * fração de pixel: ajusta uma reta a cada lado e cruza as quatro. `alcance`
 * é quanto, em pixels, a borda verdadeira pode estar do lado aproximado.
 * `null` quando algum lado não tem borda nítida.
 */
export function refinarCartao(imagem: Imagem, aproximado: Quadrilatero, alcance: number): CartaoRefinado | null {
  const centro: Ponto = [
    aproximado.reduce((s, p) => s + p[0], 0) / 4,
    aproximado.reduce((s, p) => s + p[1], 0) / 4,
  ];
  const rampas: number[] = [];
  const retas = aproximado.map((a, i) =>
    retaDoLado(imagem, a, aproximado[(i + 1) % 4], centro, Math.ceil(alcance), rampas),
  );
  const cantos = retas.map((reta, i) => {
    const anterior = retas[(i + 3) % 4];
    return reta && anterior ? cruzar(anterior, reta) : null;
  });
  if (!cantos.every((c) => c !== null) || !temFormatoDeCartao(cantos as Quadrilatero)) return null;
  return { cantos: cantos as Quadrilatero, rampa: rampas.sort((x, y) => x - y)[rampas.length >> 1] };
}

/** Confere se os cantos achados ainda têm a proporção de um cartão, com folga para a foto inclinada. */
function temFormatoDeCartao(cantos: Quadrilatero): boolean {
  const lado = (i: number) => {
    const [a, b] = [cantos[i], cantos[(i + 1) % 4]];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  };
  const [um, outro] = [lado(0) + lado(2), lado(1) + lado(3)];
  const proporcao = Math.max(um, outro) / Math.min(um, outro);
  return Math.abs(proporcao / (CARTAO_CM.largura / CARTAO_CM.altura) - 1) < FOLGA_PROPORCAO;
}
