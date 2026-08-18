/** Catálogo e preços editáveis — altere aqui quando fechar os valores finais. */

export const TAMANHOS = ["4", "6", "8", "10", "12", "14", "16"] as const;
export type Tamanho = (typeof TAMANHOS)[number];

export type CatalogoItem = {
  id: string;
  name: string;
  /** Frase curta, em linguagem simples, exibida no card */
  hint: string;
  /** Preço em centavos para evitar float */
  priceCents: number;
  /** Troque por uma foto real em /public/produtos mantendo o mesmo caminho */
  image: string;
};

export const CATALOGO: CatalogoItem[] = [
  {
    id: "camiseta-manga-curta",
    name: "Camiseta manga curta",
    hint: "Para o dia a dia e dias quentes",
    priceCents: 6000,
    image: "/produtos/camiseta-manga-curta.jpg",
  },
  {
    id: "camiseta-manga-longa",
    name: "Camiseta manga longa",
    hint: "Para os dias mais frios",
    priceCents: 7000,
    image: "/produtos/camiseta-manga-longa.jpg",
  },
  {
    id: "blusa",
    name: "Blusa",
    hint: "Blusa de frio para usar por cima",
    priceCents: 11000,
    /** Ainda sem foto na pasta — troque quando tiver o arquivo */
    image: "/produtos/blusa.svg",
  },
  {
    id: "calca",
    name: "Calça",
    hint: "Comprida, confortável para brincar",
    priceCents: 9500,
    image: "/produtos/calca.jpg",
  },
  {
    id: "bermuda",
    name: "Bermuda",
    hint: "Curta, para o calor e a educação física",
    priceCents: 7500,
    image: "/produtos/bermuda.jpg",
  },
  {
    id: "short-saia",
    name: "Short-saia",
    hint: "Saia com short por baixo",
    priceCents: 7000,
    image: "/produtos/short-saia.jpg",
  },
];

/** Destaque do hero — preços de inauguração (editáveis). */
export const PROMO_HERO = {
  priceFromCents: 9000,
  priceToCents: 6000,
  note: "preço de inauguração por peça. Você escolhe só o que precisa.",
  yearLabel: "Uniforme 2026",
} as const;

/**
 * Situação de cada tamanho. Nenhum tamanho aparece como "esgotado":
 * ou tem pronta-entrega, ou encomenda com data, ou entra na fila de aviso.
 */
export type DisponibilidadeStatus =
  | "pronta"
  | "encomenda"
  | "espera"
  | "confirmar";

export type Disponibilidade = {
  status: DisponibilidadeStatus;
  /** Data prometida quando o status é "encomenda" (ex.: "18/08") */
  prazo?: string;
};

const DISPONIBILIDADE_PADRAO: Disponibilidade = { status: "confirmar" };

/**
 * Preencha conforme a produção. Tamanho não listado usa o padrão
 * ("confirmar"), que promete o prazo no WhatsApp sem afirmar estoque.
 *
 * Exemplo:
 * "camiseta-manga-curta": {
 *   "10": { status: "pronta" },
 *   "14": { status: "encomenda", prazo: "18/08" },
 *   "16": { status: "espera" },
 * },
 */
export const DISPONIBILIDADE: Record<
  string,
  Partial<Record<Tamanho, Disponibilidade>>
> = {};

export function getDisponibilidade(
  itemId: string,
  tamanho: Tamanho,
): Disponibilidade {
  return DISPONIBILIDADE[itemId]?.[tamanho] ?? DISPONIBILIDADE_PADRAO;
}

export function describeDisponibilidade(d: Disponibilidade): string {
  switch (d.status) {
    case "pronta":
      return "Pronta entrega";
    case "encomenda":
      return d.prazo
        ? `Sob encomenda — fica pronto até ${d.prazo}`
        : "Sob encomenda — combinamos a data";
    case "espera":
      return "Sem previsão por enquanto — avisamos você assim que chegar";
    default:
      return "Confirmamos o prazo com você no WhatsApp";
  }
}

/** Referência de altura por tamanho — ajuda quem não sabe o número. */
export const GUIA_TAMANHOS: { tamanho: Tamanho; altura: string; idade: string }[] = [
  { tamanho: "4", altura: "até 1,05 m", idade: "3 a 4 anos" },
  { tamanho: "6", altura: "1,06 m a 1,15 m", idade: "5 a 6 anos" },
  { tamanho: "8", altura: "1,16 m a 1,28 m", idade: "7 a 8 anos" },
  { tamanho: "10", altura: "1,29 m a 1,38 m", idade: "9 a 10 anos" },
  { tamanho: "12", altura: "1,39 m a 1,48 m", idade: "11 a 12 anos" },
  { tamanho: "14", altura: "1,49 m a 1,58 m", idade: "13 a 14 anos" },
  { tamanho: "16", altura: "acima de 1,58 m", idade: "15 anos ou mais" },
];

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getCatalogItem(id: string): CatalogoItem | undefined {
  return CATALOGO.find((item) => item.id === id);
}
