import { TAMANHOS_KIT, type TamanhoKit } from "./kit";
import type { PecaKit } from "./kit";

type Grade = {
  medidas: readonly [string, string];
  valores: Record<TamanhoKit, readonly [number, number]>;
};

/**
 * Medidas conferidas da peça estendida, em centímetros.
 * Peça ausente, como a short-saia, aparece como "em conferência".
 * Camiseta manga curta e manga longa usam a mesma grade.
 * Bermuda e calça também.
 */
const CAMISETA: Grade = {
  medidas: ["Comprimento", "Largura do corpo"],
  valores: {
    "4": [45, 35],
    "6": [49, 37],
    "8": [53, 39],
    "10": [57, 41],
    "12": [61, 43],
    "14": [65, 45],
    P: [69, 49],
    M: [73, 53],
    G: [77, 57],
    GG: [81, 61],
  },
};

const AGASALHO: Grade = {
  medidas: ["Comprimento da frente", "Largura do corpo"],
  valores: {
    "4": [46, 36],
    "6": [50, 38],
    "8": [54, 40],
    "10": [58, 42],
    "12": [62, 44],
    "14": [66, 46],
    P: [70, 50],
    M: [74, 54],
    G: [78, 58],
    GG: [82, 62],
  },
};

const CINTURA: Grade = {
  medidas: ["Cintura com elástico relaxado", "Quadril"],
  valores: {
    "4": [22, 34],
    "6": [24, 36],
    "8": [26, 38],
    "10": [28, 40],
    "12": [30, 42],
    "14": [32, 44],
    P: [34, 48],
    M: [36, 52],
    G: [38, 56],
    GG: [40, 60],
  },
};

const CONFERIDAS: Partial<Record<string, Grade>> = {
  "camiseta-manga-curta": CAMISETA,
  "camiseta-manga-longa": CAMISETA,
  blusa: AGASALHO,
  bermuda: CINTURA,
  calca: CINTURA,
};

function frase(grade: Grade, tamanho: TamanhoKit) {
  const [primeira, segunda] = grade.medidas;
  const [a, b] = grade.valores[tamanho];
  const complemento = segunda.charAt(0).toLocaleLowerCase("pt-BR") + segunda.slice(1);
  return `${primeira} ${a} cm, ${complemento} ${b} cm`;
}

export function rotuloMedida(catalogoId: string, tamanho: TamanhoKit) {
  const grade = CONFERIDAS[catalogoId];
  return grade ? frase(grade, tamanho) : "";
}

export function textoMedidas(peca: PecaKit) {
  const titulo =
    peca.quantidade > 1
      ? `${peca.nome} (${peca.quantidade} peças, no mesmo tamanho)`
      : peca.nome;
  const grade = CONFERIDAS[peca.catalogoId];
  if (!grade) {
    return [
      titulo,
      "",
      "As medidas desta peça ainda estão em conferência. Por enquanto, compare com uma peça que já serve bem no(a) aluno(a).",
    ].join("\n");
  }

  const linhas = TAMANHOS_KIT.map((tamanho) => {
    const detalhe = frase(grade, tamanho);
    const minusculo = detalhe.charAt(0).toLocaleLowerCase("pt-BR") + detalhe.slice(1);
    return `Tamanho ${tamanho}: ${minusculo}`;
  });
  return [
    titulo,
    "Medidas da peça estendida:",
    "",
    ...linhas,
    "",
    grade === CINTURA
      ? "Compare com uma peça que serve bem no(a) aluno(a), estendida sem puxar o elástico. A cintura e o quadril são larguras de um lado ao outro, não a volta completa do corpo. O quadril é medido 20 cm abaixo do cós."
      : "Compare com uma peça que serve bem no(a) aluno(a), estendida sobre uma mesa. Meça o comprimento da frente do ombro à barra e a largura de um lado ao outro, abaixo das mangas.",
  ].join("\n");
}
