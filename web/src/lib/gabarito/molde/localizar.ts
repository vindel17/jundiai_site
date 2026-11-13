import type { Ponto } from "../glb";
import { encostaNaBorda, tracarContorno } from "./contorno";
import { areaComSinal } from "./geometria";
import { separarPeca, type Imagem, type Mascara } from "./mascara";
import { acharPontos, type PontosCamiseta } from "./pontos";

const AREA_MINIMA = 0.03;

/** Índices, no contorno, de todos os pontos de medida: os da camiseta mais o centro da barra. */
export type PontosMedida = PontosCamiseta & { barra: number };

export type PecaNaFoto = {
  mascara: Mascara;
  /** Pixels da beirada da peça, em sentido horário na tela */
  contorno: Ponto[];
};

export type CamisetaNaFoto = PecaNaFoto & { pontos: PontosMedida };

/** Gira a peça para as axilas ficarem na horizontal, com a origem no meio delas. */
export function endireitar(contorno: Ponto[], p: PontosCamiseta): Ponto[] {
  const [ae, ad] = [contorno[p.axilaEsq], contorno[p.axilaDir]];
  const angulo = -Math.atan2(ad[1] - ae[1], ad[0] - ae[0]);
  const [cx, cy] = [(ae[0] + ad[0]) / 2, (ae[1] + ad[1]) / 2];
  const [cos, sen] = [Math.cos(angulo), Math.sin(angulo)];
  return contorno.map(([x, y]): Ponto => {
    const [dx, dy] = [x - cx, y - cy];
    return [dx * cos - dy * sen, dx * sen + dy * cos];
  });
}

/** Centro da barra: dos pontos mais baixos perto do eixo da peça já endireitada, o mais central. */
function acharBarra(girado: Ponto[]): number {
  const xs = girado.map((p) => p[0]);
  const faixa = 0.03 * (Math.max(...xs) - Math.min(...xs));
  const perto = girado.map((_, i) => i).filter((i) => Math.abs(girado[i][0]) < faixa);
  if (!perto.length) return -1;
  // A barra reta dá vários pontos na mesma altura, com um pixel de diferença para mais ou para menos.
  const fundo = Math.max(...perto.map((i) => girado[i][1])) - 1.5;
  return perto
    .filter((i) => girado[i][1] >= fundo)
    .reduce((melhor, i) => (Math.abs(girado[i][0]) < Math.abs(girado[melhor][0]) ? i : melhor));
}

/** Separa do fundo a peça estendida e traça a beirada dela. `nome` é como a peça aparece nos avisos. */
export function localizarPeca(imagem: Imagem, nome = "camiseta"): PecaNaFoto | { erro: string } {
  const mascara = separarPeca(imagem);
  const area = mascara.dados.reduce((s, v) => s + v, 0) / mascara.dados.length;
  if (area < AREA_MINIMA) {
    return { erro: `Não encontrei a ${nome} na foto. Use um fundo liso que contraste bem com o tecido.` };
  }
  if (encostaNaBorda(mascara)) {
    return { erro: `A ${nome} encosta na borda da foto. Afaste o celular para ela caber inteira, com folga.` };
  }
  const contorno = tracarContorno(mascara);
  return { mascara, contorno: areaComSinal(contorno) < 0 ? contorno.reverse() : contorno };
}

/** Acha na beirada de uma camiseta, com a gola para cima, os pontos de medida dela. */
export function pontosDaCamiseta(contorno: Ponto[]): PontosMedida | { erro: string } {
  const pontos = acharPontos(contorno);
  if (!pontos) {
    return {
      erro: "Não achei a gola e as duas axilas. Confira se a camiseta está de frente, com as mangas abertas, e se o fundo contrasta com o tecido.",
    };
  }
  const barra = acharBarra(endireitar(contorno, pontos));
  if (barra < 0) return { erro: "Não achei a barra da camiseta na foto." };
  return { ...pontos, barra };
}

/** Acha a camiseta estendida de frente, com a gola para cima, e os pontos de medida dela. */
export function localizarCamiseta(imagem: Imagem): CamisetaNaFoto | { erro: string } {
  const peca = localizarPeca(imagem);
  if ("erro" in peca) return peca;
  const pontos = pontosDaCamiseta(peca.contorno);
  return "erro" in pontos ? pontos : { ...peca, pontos };
}
