import type { Ponto } from "../glb";
import { areaComSinal, distanciaAteReta, reentrancias, trecho, type Reentrancia } from "../molde/geometria";
import { distancia } from "./receita";

/** A beirada entre as pontas do cós pode ser até este tanto mais longa que a reta entre elas. */
const FOLGA_DO_COS = 1.3;
/** A beirada é medida de tantos em tantos pontos, para os degraus dos pixels não a alongarem. */
const PASSO_DA_BEIRADA = 8;
/** O vão entre as pernas só conta quando é mais fundo que esta fração do tamanho da peça (raiz da área). */
const GANCHO_MINIMO = 0.08;
/** E quando é estreito: a largura dele a meia profundidade é no máximo este tanto da profundidade. */
const GANCHO_ESTREITO = 2;

/** Índice do ponto mais avançado na direção dada. */
function extremo(contorno: Ponto[], [dx, dy]: Ponto): number {
  let melhor = 0;
  contorno.forEach(([x, y], i) => {
    if (x * dx + y * dy > contorno[melhor][0] * dx + contorno[melhor][1] * dy) melhor = i;
  });
  return melhor;
}

/** Largura da reentrância a meia profundidade: de onde a beirada passa da metade do fundo até onde volta. */
function larguraNoMeio(contorno: Ponto[], r: Reentrancia): number {
  const [a, b] = [contorno[r.inicio], contorno[r.fim]];
  const fundos = trecho(contorno, r.inicio, r.fim).filter((p) => distanciaAteReta(p, a, b) >= r.profundidade / 2);
  return distancia(fundos[0], fundos[fundos.length - 1]);
}

/**
 * Para que lado o cós corre, da ponta esquerda para a direita. O vão entre
 * as pernas mostra como a peça está virada na foto: o cós fica do lado
 * oposto ao dele. Sem vão (short-saia, pernas juntas), vale o cós para cima.
 */
function direcaoDoCos(contorno: Ponto[]): Ponto {
  const tamanho = Math.sqrt(Math.abs(areaComSinal(contorno)));
  // O cós com elástico também afunda, mas numa curva larga e rasa; o vão é fundo e estreito.
  const gancho = reentrancias(contorno)
    .filter(
      (r) =>
        r.profundidade > GANCHO_MINIMO * tamanho &&
        larguraNoMeio(contorno, r) < GANCHO_ESTREITO * r.profundidade,
    )
    .sort((a, b) => b.profundidade - a.profundidade)[0];
  if (!gancho) return [1, 0];
  // O cós corre paralelo à linha que liga as barras das duas pernas, com o fundo do vão do lado dele.
  const [a, b, fundo] = [contorno[gancho.inicio], contorno[gancho.fim], contorno[gancho.fundo]];
  const barras = distancia(a, b);
  const [tx, ty] = [(b[0] - a[0]) / barras, (b[1] - a[1]) / barras];
  // Quem anda no sentido do cós, da ponta esquerda para a direita, tem as pernas à direita e o fundo do vão à esquerda.
  const fundoAEsquerda = (fundo[0] - a[0]) * -ty + (fundo[1] - a[1]) * tx < 0;
  return fundoAEsquerda ? [tx, ty] : [-tx, -ty];
}

/** Os dois cantos da peça do lado do cós, para um cós que corre na direção dada. */
function cantosDoCos(contorno: Ponto[], [tx, ty]: Ponto): [number, number] {
  return [extremo(contorno, [-tx + ty, -ty - tx]), extremo(contorno, [tx + ty, ty - tx])];
}

/** Comprimento da beirada indo de um ponto ao outro, no sentido dos índices. */
function percurso(contorno: Ponto[], de: number, ate: number): number {
  const n = contorno.length;
  const passos = (ate - de + n) % n || n;
  let total = 0;
  for (let k = 0; k < passos; k += PASSO_DA_BEIRADA) {
    total += distancia(contorno[(de + k) % n], contorno[(de + Math.min(k + PASSO_DA_BEIRADA, passos)) % n]);
  }
  return total;
}

/**
 * Pontas do cós na beirada da peça, virada para qualquer lado: a esquerda e
 * a direita de quem a olha com o cós para cima. `null` quando a beirada
 * entre elas não é reta como um cós.
 */
export function acharCos(contorno: Ponto[]): [Ponto, Ponto] | null {
  let [esq, dir] = cantosDoCos(contorno, direcaoDoCos(contorno));
  const corda = distancia(contorno[esq], contorno[dir]);
  if (!corda) return null;
  // Com a peça um pouco torta, os cantos são procurados de novo ao longo do cós achado.
  const [a, b] = [contorno[esq], contorno[dir]];
  [esq, dir] = cantosDoCos(contorno, [(b[0] - a[0]) / corda, (b[1] - a[1]) / corda]);
  const reta = distancia(contorno[esq], contorno[dir]);
  // Se a beirada entre as pontas faz curva ou entra na peça, não é o cós.
  const peloCos = Math.min(percurso(contorno, esq, dir), percurso(contorno, dir, esq));
  return reta && peloCos <= FOLGA_DO_COS * reta ? [contorno[esq], contorno[dir]] : null;
}
