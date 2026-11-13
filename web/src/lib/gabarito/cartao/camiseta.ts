import type { Ponto } from "../glb";
import { pontosDaCamiseta } from "../molde/localizar";
import type { Quadrilatero } from "./homografia";
import { distancia, escalaDoCartao, meio, type Medidas, type Pontos, type Receita } from "./receita";

export type PontoDaCamiseta = "ombroEsq" | "ombroDir" | "axilaEsq" | "axilaDir" | "barra";

/** Comprimento (do ombro à barra) e largura (de axila a axila), na ordem da grade da camiseta. */
function medir(pontos: Pontos<PontoDaCamiseta>, cartao: Quadrilatero): Medidas | null {
  const escala = escalaDoCartao(cartao);
  if (!escala) return null;
  const { paraCm } = escala;
  const [axilaEsq, axilaDir] = [paraCm(pontos.axilaEsq), paraCm(pontos.axilaDir)];
  const ombros = meio(paraCm(pontos.ombroEsq), paraCm(pontos.ombroDir));
  const barra = paraCm(pontos.barra);

  const largura = distancia(axilaEsq, axilaDir);
  if (!largura) return null;
  // O comprimento é medido reto para baixo: perpendicular à linha das axilas.
  const paraBaixo: Ponto = [-(axilaDir[1] - axilaEsq[1]) / largura, (axilaDir[0] - axilaEsq[0]) / largura];
  const descida = (barra[0] - ombros[0]) * paraBaixo[0] + (barra[1] - ombros[1]) * paraBaixo[1];
  // Meio da camiseta: a meia altura, no eixo. A barra pode ter sido marcada fora do eixo.
  const centro: Ponto = [ombros[0] + (paraBaixo[0] * descida) / 2, ombros[1] + (paraBaixo[1] * descida) / 2];
  const centroDoCartao = meio(paraCm(cartao[0]), paraCm(cartao[2]));
  return { valores: [Math.abs(descida), largura], cartaoDoCentro: distancia(centroDoCartao, centro) };
}

/** Camiseta de manga curta ou longa, estendida de frente, com a gola para cima. */
export const RECEITA_CAMISETA: Receita<PontoDaCamiseta> = {
  nome: "camiseta",
  lugarDoCartao: "bem no centro da camiseta",
  acharPontos(contorno) {
    const p = pontosDaCamiseta(contorno);
    if ("erro" in p) return p.erro;
    return {
      ombroEsq: contorno[p.ombroEsq],
      ombroDir: contorno[p.ombroDir],
      axilaEsq: contorno[p.axilaEsq],
      axilaDir: contorno[p.axilaDir],
      barra: contorno[p.barra],
    };
  },
  medir,
};
