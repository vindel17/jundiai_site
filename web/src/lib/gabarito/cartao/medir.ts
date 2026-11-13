import type { Ponto } from "../glb";
import { localizarPeca } from "../molde/localizar";
import type { Imagem } from "../molde/mascara";
import { acharCartao } from "./achar";
import { refinarCartao } from "./bordas";
import type { Quadrilatero } from "./homografia";
import { reduzir } from "./imagem";
import { distancia, type Medidas, type Pontos, type Receita } from "./receita";

/** A peça achada na foto, em pixels: a beirada dela e os pontos de medida. */
export type Marcacao<P extends string = string> = { contornoFoto: Ponto[]; pontosFoto: Pontos<P> };

export type Medicao<P extends string = string> = Medidas &
  Marcacao<P> & {
    cartaoFoto: Quadrilatero;
    /** Em quantos pixels a borda do cartão aparece borrada */
    desfoque: number;
    avisos: string[];
  };

/** O que já foi achado antes da falha vem junto, para a correção à mão. */
export type FalhaNaMedicao<P extends string = string> = { erro: string } & Partial<Marcacao<P>>;

/** A peça é procurada numa cópia da foto com o lado maior até este tamanho, em pixels. */
const LADO_DE_BUSCA = 1000;
/** Com o cartão a mais que isto, em cm, do meio da região medida, a inclinação da foto pesa demais. */
const DESVIO_DO_CENTRO = 10;
/** Abaixo deste tamanho do cartão na foto, em pixels, a medida perde precisão. */
const CARTAO_PEQUENO = 120;
/** Borda do cartão borrada por mais que esta fração do lado menor dele (uns 4,5 mm): foto sem foco. */
const DESFOQUE_MAXIMO = 0.085;
/** Até onde procurar a borda em volta de um canto marcado com o dedo, em fração do lado menor do cartão. */
const ALCANCE_DO_DEDO = 0.3;

/** O que na foto tira precisão da medida, em palavras para quem fotografou. */
export function avisosDaFoto(medidas: Medidas, cartao: Quadrilatero, receita: Receita): string[] {
  const avisos: string[] = [];
  if (medidas.cartaoDoCentro > DESVIO_DO_CENTRO) {
    avisos.push(
      `O cartão está longe da parte medida da peça. Para medir melhor, coloque o cartão ${receita.lugarDoCartao}.`,
    );
  }
  const ladoMaior = Math.max(distancia(cartao[0], cartao[1]), distancia(cartao[1], cartao[2]));
  if (ladoMaior < CARTAO_PEQUENO) {
    avisos.push("O cartão ficou pequeno na foto. Chegue mais perto, deixando a peça inteira aparecer.");
  }
  return avisos;
}

/**
 * Leva os cantos marcados à mão, aproximados, para as bordas verdadeiras
 * do cartão. `null` quando não há borda nítida perto deles.
 */
export function encaixarCartao(imagem: Imagem, cantos: Quadrilatero): Quadrilatero | null {
  const ladoMenor = Math.min(distancia(cantos[0], cantos[1]), distancia(cantos[1], cantos[2]));
  return refinarCartao(imagem, cantos, ALCANCE_DO_DEDO * ladoMenor)?.cantos ?? null;
}

/**
 * Mede uma peça estendida de frente, com um cartão de tamanho padrão em
 * cima dela. Devolve as duas medidas da receita em cm, ou o motivo de não
 * ter conseguido, em palavras para quem tirou a foto.
 */
export function medirPeca<P extends string>(imagem: Imagem, receita: Receita<P>): Medicao<P> | FalhaNaMedicao<P> {
  const fator = Math.max(1, Math.ceil(Math.max(imagem.largura, imagem.altura) / LADO_DE_BUSCA));
  const reduzida = fator > 1 ? reduzir(imagem, fator) : imagem;
  const peca = localizarPeca(reduzida, receita.nome);
  if ("erro" in peca) return peca;

  // Centro do pixel reduzido, em pixels da foto inteira.
  const naFoto = ([x, y]: Ponto): Ponto => [x * fator + (fator - 1) / 2, y * fator + (fator - 1) / 2];
  const contornoFoto = peca.contorno.map(naFoto);
  const achados = receita.acharPontos(peca.contorno);
  if (typeof achados === "string") return { erro: achados, contornoFoto };
  const nomes = Object.keys(achados) as P[];
  const marcacao: Marcacao<P> = {
    contornoFoto,
    pontosFoto: Object.fromEntries(nomes.map((nome) => [nome, naFoto(achados[nome])])) as Pontos<P>,
  };
  const falha = (erro: string): FalhaNaMedicao<P> => ({ erro, ...marcacao });

  const aproximado = acharCartao(reduzida, peca.mascara);
  if (!aproximado) {
    return falha(
      `Não encontrei o cartão em cima da peça. Use um cartão de cor bem diferente do tecido e coloque ${receita.lugarDoCartao}, longe de estampas.`,
    );
  }
  const refinado = refinarCartao(imagem, aproximado.map(naFoto) as Quadrilatero, 2.5 * fator + 4);
  if (!refinado) {
    return falha(
      "Encontrei o cartão, mas não consegui medir as bordas dele. Tire outra foto com mais luz, sem sombra e sem reflexo em cima do cartão.",
    );
  }
  const cartao = refinado.cantos;
  const ladoMenor = Math.min(distancia(cartao[0], cartao[1]), distancia(cartao[1], cartao[2]));
  if (refinado.rampa > DESFOQUE_MAXIMO * ladoMenor) {
    return falha("A foto ficou fora de foco ou tremida. Limpe a lente, segure o celular firme e tire outra.");
  }

  const pontosFoto = receita.ajustar?.(marcacao.pontosFoto, cartao, contornoFoto) ?? marcacao.pontosFoto;
  const medidas = receita.medir(pontosFoto, cartao);
  if (!medidas) {
    return falha("Não consegui usar o cartão como referência. Tire outra foto, de cima, com o cartão inteiro aparecendo.");
  }
  return {
    ...medidas,
    contornoFoto,
    pontosFoto,
    cartaoFoto: cartao,
    desfoque: refinado.rampa,
    avisos: avisosDaFoto(medidas, cartao, receita),
  };
}
