export const FIM_RESERVA = new Date("2026-12-31T23:59:59.000-03:00");

/** Grade do kit 2027. A compra avulsa continua na grade do catálogo, que inclui o 16. */
export const TAMANHOS_KIT = ["4", "6", "8", "10", "12", "14", "P", "M", "G", "GG"] as const;

export type TamanhoKit = (typeof TAMANHOS_KIT)[number];

export type KitGenero = "masculino" | "feminino";

export type PecaChave = "curta" | "longa" | "inferior" | "calca" | "blusa";

export type PecaKit = {
  chave: PecaChave;
  catalogoId: string;
  nome: string;
  quantidade: number;
};

export type TamanhosKit = Record<PecaChave, TamanhoKit>;

const ORDEM: PecaChave[] = ["curta", "longa", "inferior", "calca", "blusa"];

export function reservaAberta(agora = new Date()) {
  return agora.getTime() <= FIM_RESERVA.getTime();
}

export function pecasDoKit(kit: KitGenero): PecaKit[] {
  return [
    {
      chave: "curta",
      catalogoId: "camiseta-manga-curta",
      nome: "Camiseta manga curta",
      quantidade: 2,
    },
    {
      chave: "longa",
      catalogoId: "camiseta-manga-longa",
      nome: "Camiseta manga longa",
      quantidade: 1,
    },
    kit === "feminino"
      ? {
          chave: "inferior",
          catalogoId: "short-saia",
          nome: "Short-saia",
          quantidade: 1,
        }
      : {
          chave: "inferior",
          catalogoId: "bermuda",
          nome: "Bermuda",
          quantidade: 1,
        },
    { chave: "calca", catalogoId: "calca", nome: "Calça", quantidade: 1 },
    { chave: "blusa", catalogoId: "blusa", nome: "Blusa de frio", quantidade: 1 },
  ];
}

export function proximaPeca(atual: PecaChave | ""): PecaChave | null {
  if (!atual) return ORDEM[0];
  const indice = ORDEM.indexOf(atual);
  return ORDEM[indice + 1] ?? null;
}

const GRADE_KIT = new Set<string>(TAMANHOS_KIT);

/** Aceita "04" e "gg" e devolve o valor da grade, como "4" e "GG". */
export function tamanhoKit(valor: string): TamanhoKit | null {
  const limpo = valor.trim().replace(/^tamanho\s+/i, "").replace(/^tam\.?\s*/i, "");
  if (!limpo) return null;
  const normalizado = /^\d+$/.test(limpo) ? limpo.replace(/^0+(?=\d)/, "") : limpo.toUpperCase();
  return GRADE_KIT.has(normalizado) ? (normalizado as TamanhoKit) : null;
}

export function eTamanhoKit(valor: string): valor is TamanhoKit {
  return GRADE_KIT.has(valor);
}

/** O banco guarda masculino/feminino; para a família o kit é "com bermuda" ou "com short-saia". */
export function rotuloKit(kit: KitGenero) {
  return kit === "feminino" ? "Com short-saia" : "Com bermuda";
}

export function descricaoKit(kit: KitGenero) {
  const inferior = kit === "feminino" ? "short-saia" : "bermuda";
  return `2 camisetas manga curta, 1 camiseta manga longa, 1 ${inferior}, 1 calça e 1 blusa de frio.`;
}

export function resumoTamanhos(kit: KitGenero, tamanhos: TamanhosKit) {
  return pecasDoKit(kit)
    .map((peca) => {
      const quantidade = peca.quantidade > 1 ? ` (${peca.quantidade} peças)` : "";
      return `${peca.nome}${quantidade}: ${tamanhos[peca.chave]}`;
    })
    .join("\n");
}
