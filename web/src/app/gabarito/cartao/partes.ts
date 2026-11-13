import type { Medidas, Pontos, Receita } from "@/lib/gabarito/cartao/receita";
import { RECEITAS, type Parte } from "@/lib/gabarito/cartao/receitas";
import { pecasDoKit, type PecaChave } from "@/lib/reserva/kit";
import { gradeDaPeca } from "@/lib/reserva/medidas";
import { sugerirTamanho } from "@/lib/reserva/sugestao";
import { camisetaPadrao, cinturaPadrao } from "./padrao";

/** Um ponto de medida, ou o meio de dois. */
export type Ponta = string | [string, string];

/** O que a tela precisa saber sobre cada foto do kit. */
export type ConfigDaParte = {
  rotulo: string;
  /** Como a parte entra em "falta a foto da…" */
  nome: string;
  receita: Receita;
  /** Peça do catálogo cuja grade de tamanhos vale para a parte toda */
  grade: string;
  /** Peças do kit que levam o tamanho sugerido por esta foto */
  pecas: PecaChave[];
  /** Nome de cada medida na tela, na ordem da grade */
  medidas: [string, string];
  /** Pontos que dá para arrastar, com o nome de cada um */
  alcas: Record<string, string>;
  /** Linhas tracejadas que mostram o que foi medido */
  linhas: [Ponta, Ponta][];
  passos: string[];
  pontosPadrao(largura: number, altura: number): Pontos;
};

export const PARTES: Record<Parte, ConfigDaParte> = {
  cima: {
    rotulo: "Parte de cima",
    nome: "parte de cima",
    receita: RECEITAS.cima,
    grade: "camiseta-manga-curta",
    // A blusa de frio tem 1 cm a mais em cada medida, em todos os tamanhos: leva o tamanho da camiseta.
    pecas: ["curta", "longa", "blusa"],
    medidas: ["Comprimento, do ombro à barra", "Largura, de axila a axila"],
    alcas: {
      ombroEsq: "Ombro esquerdo, junto à gola",
      ombroDir: "Ombro direito, junto à gola",
      axilaEsq: "Axila esquerda",
      axilaDir: "Axila direita",
      barra: "Barra",
    },
    linhas: [
      ["axilaEsq", "axilaDir"],
      [["ombroEsq", "ombroDir"], "barra"],
    ],
    passos: [
      "Estenda uma camiseta que serve bem, de frente, sem puxar, com as mangas abertas e a gola para cima, sobre um fundo liso que contraste com o tecido. Pode ser de manga curta ou longa.",
      "Coloque um cartão do tamanho de cartão de banco bem no meio da camiseta, longe de estampa. Serve qualquer um, de preferência de cor bem diferente do tecido. Pode ficar com o verso para cima.",
      "Fotografe de cima, com a camiseta inteira no quadro e folga nas bordas. Luz difusa, sem sombra forte nem reflexo no cartão.",
    ],
    pontosPadrao: camisetaPadrao,
  },
  baixo: {
    rotulo: "Parte de baixo",
    nome: "parte de baixo",
    receita: RECEITAS.baixo,
    // A calça usa a mesma grade; a short-saia, por decisão da loja, também.
    grade: "bermuda",
    pecas: ["inferior", "calca"],
    medidas: ["Cintura, com o elástico relaxado", "Quadril, 20 cm abaixo do cós"],
    alcas: {
      cosEsq: "Ponta esquerda do cós",
      cosDir: "Ponta direita do cós",
      quadrilEsq: "Lado esquerdo do quadril",
      quadrilDir: "Lado direito do quadril",
    },
    linhas: [
      ["cosEsq", "cosDir"],
      ["quadrilEsq", "quadrilDir"],
    ],
    passos: [
      "Estenda uma bermuda ou calça que serve bem, de frente, com o cós para cima, sem puxar o elástico e com as pernas retas e um pouco afastadas uma da outra, sobre um fundo liso de cor diferente de todas as cores da peça.",
      "Coloque um cartão do tamanho de cartão de banco no meio da peça, logo abaixo do cós. Serve qualquer um, de preferência de cor bem diferente do tecido. Pode ficar com o verso para cima.",
      "Fotografe de cima, com a peça inteira no quadro e folga nas bordas. A bermuda e a calça têm a mesma tabela: se tiver as duas, use a bermuda, que cabe melhor na foto.",
    ],
    pontosPadrao: cinturaPadrao,
  },
};

export const ORDEM_DAS_PARTES = Object.keys(PARTES) as Parte[];

/** Nomes das peças do kit, com bermuda ou com short-saia, que levam o tamanho da parte. */
export function pecasDaParte(parte: Parte): string[] {
  const todas = [...pecasDoKit("masculino"), ...pecasDoKit("feminino")];
  const nomes = todas.filter((peca) => PARTES[parte].pecas.includes(peca.chave)).map((peca) => peca.nome);
  return [...new Set(nomes)];
}

export function sugestaoDaParte(parte: Parte, medidas: Medidas) {
  const grade = gradeDaPeca(PARTES[parte].grade);
  return grade ? sugerirTamanho(grade, medidas.valores) : null;
}
