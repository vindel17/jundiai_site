import type { Ponto } from "../glb";
import { acharCos } from "./cos";
import type { Quadrilatero } from "./homografia";
import { distancia, escalaDoCartao, meio, type Medidas, type Pontos, type Receita } from "./receita";

export type PontoDaCintura = "cosEsq" | "cosDir" | "quadrilEsq" | "quadrilDir";

/** A grade mede o quadril a esta distância abaixo do cós, em cm. */
export const ALTURA_DO_QUADRIL = 20;
/** Sem cartão não há escala: o quadril começa a esta fração da largura do cós, abaixo dele. */
const PALPITE_DO_QUADRIL = 0.7;

function acharPontos(contorno: Ponto[]): Pontos<PontoDaCintura> | string {
  const cos = acharCos(contorno);
  if (!cos) {
    return "Não achei o cós da peça. Confira se a bermuda ou calça está de frente, com o cós esticado, sem dobras, e as pernas um pouco afastadas.";
  }
  const [a, b] = cos;
  const paraBaixo: Ponto = [-(b[1] - a[1]) * PALPITE_DO_QUADRIL, (b[0] - a[0]) * PALPITE_DO_QUADRIL];
  return {
    cosEsq: a,
    cosDir: b,
    quadrilEsq: [a[0] + paraBaixo[0], a[1] + paraBaixo[1]],
    quadrilDir: [b[0] + paraBaixo[0], b[1] + paraBaixo[1]],
  };
}

/**
 * Régua da peça em cm: a origem é a ponta esquerda do cós, `ao` corre ao
 * longo dele e `abaixo` desce em direção às pernas.
 */
function reguaDoCos(pontos: Pontos<PontoDaCintura>, cartao: Quadrilatero) {
  const escala = escalaDoCartao(cartao);
  if (!escala) return null;
  const { paraCm, paraFoto } = escala;
  const [e, d] = [paraCm(pontos.cosEsq), paraCm(pontos.cosDir)];
  const cintura = distancia(e, d);
  if (!cintura) return null;
  const ao: Ponto = [(d[0] - e[0]) / cintura, (d[1] - e[1]) / cintura];
  // Na foto, "abaixo" é à direita de quem vai da ponta esquerda à direita do cós.
  // Em cm o lado pode estar espelhado: um ponto da foto abaixo do cós diz qual é.
  const [a, b] = [pontos.cosEsq, pontos.cosDir];
  const referencia = paraCm([(a[0] + b[0]) / 2 - (b[1] - a[1]), (a[1] + b[1]) / 2 + (b[0] - a[0])]);
  const lado = (referencia[0] - e[0]) * -ao[1] + (referencia[1] - e[1]) * ao[0] >= 0 ? 1 : -1;
  const abaixo: Ponto = [-ao[1] * lado, ao[0] * lado];
  return {
    cintura,
    paraCm,
    /** Posição ao longo do cós e distância abaixo dele, em cm */
    posicao(p: Ponto): Ponto {
      const c = paraCm(p);
      return [(c[0] - e[0]) * ao[0] + (c[1] - e[1]) * ao[1], (c[0] - e[0]) * abaixo[0] + (c[1] - e[1]) * abaixo[1]];
    },
    naFoto: ([u, v]: Ponto) => paraFoto([e[0] + u * ao[0] + v * abaixo[0], e[1] + u * ao[1] + v * abaixo[1]]),
  };
}

/** Onde a beirada (já na régua do cós) cruza a altura dada: o cruzamento mais à esquerda e o mais à direita. */
function ladosNaAltura(beirada: Ponto[], altura: number): [number, number] | null {
  let [minimo, maximo] = [Infinity, -Infinity];
  beirada.forEach(([u1, v1], i) => {
    const [u2, v2] = beirada[(i + 1) % beirada.length];
    if (v1 === v2 || (v1 - altura) * (v2 - altura) > 0) return;
    const u = u1 + ((altura - v1) / (v2 - v1)) * (u2 - u1);
    minimo = Math.min(minimo, u);
    maximo = Math.max(maximo, u);
  });
  return maximo > minimo ? [minimo, maximo] : null;
}

/**
 * Põe os pontos do quadril 20 cm abaixo do cós. Com a beirada da peça,
 * eles vão para as laterais dela nessa altura; sem ela, ou quando a pessoa
 * acabou de arrastar um deles, só deslizam para a altura certa.
 */
function ajustar(
  pontos: Pontos<PontoDaCintura>,
  cartao: Quadrilatero,
  contorno: Ponto[] | null,
  movido?: PontoDaCintura,
): Pontos<PontoDaCintura> {
  const regua = reguaDoCos(pontos, cartao);
  if (!regua) return pontos;
  const naMao = movido === "quadrilEsq" || movido === "quadrilDir";
  const lados =
    (contorno && !naMao && ladosNaAltura(contorno.map(regua.posicao), ALTURA_DO_QUADRIL)) ||
    ([regua.posicao(pontos.quadrilEsq)[0], regua.posicao(pontos.quadrilDir)[0]] as const);
  const [quadrilEsq, quadrilDir] = lados.map((u) => regua.naFoto([u, ALTURA_DO_QUADRIL]));
  const validos = [...quadrilEsq, ...quadrilDir].every(Number.isFinite);
  return validos ? { ...pontos, quadrilEsq, quadrilDir } : pontos;
}

/** Cintura (de uma ponta à outra do cós) e quadril (largura da peça 20 cm abaixo), na ordem da grade. */
function medir(pontos: Pontos<PontoDaCintura>, cartao: Quadrilatero): Medidas | null {
  const regua = reguaDoCos(pontos, cartao);
  if (!regua) return null;
  const { paraCm } = regua;
  const quadril = Math.abs(regua.posicao(pontos.quadrilDir)[0] - regua.posicao(pontos.quadrilEsq)[0]);
  if (!quadril) return null;
  const centro = meio(
    meio(paraCm(pontos.cosEsq), paraCm(pontos.cosDir)),
    meio(paraCm(pontos.quadrilEsq), paraCm(pontos.quadrilDir)),
  );
  const centroDoCartao = meio(paraCm(cartao[0]), paraCm(cartao[2]));
  return { valores: [regua.cintura, quadril], cartaoDoCentro: distancia(centroDoCartao, centro) };
}

/**
 * Bermuda ou calça estendida de frente, virada para qualquer lado. A
 * short-saia, que não mostra o vão entre as pernas, precisa do cós para cima.
 */
export const RECEITA_CINTURA: Receita<PontoDaCintura> = {
  nome: "bermuda ou calça",
  lugarDoCartao: "no meio da peça, logo abaixo do cós",
  acharPontos,
  ajustar,
  medir,
};
