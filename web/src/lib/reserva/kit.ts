export const FIM_RESERVA = new Date("2026-12-31T23:59:59.000-03:00");

/**
 * Grade do kit 2027. A compra avulsa continua na grade do catálogo, que inclui o 16.
 * São 9 tamanhos porque a lista do WhatsApp tem 10 linhas e uma é "Não quero esta peça".
 */
export const TAMANHOS_KIT = ["4", "6", "8", "10", "12", "14", "P", "M", "G"] as const;

/** Valor gravado na conversa e enviado pelo formulário quando a família tira a peça do kit. */
export const SEM_PECA = "sem";

export type TamanhoKit = (typeof TAMANHOS_KIT)[number];

export type KitGenero = "masculino" | "feminino";

export type PecaChave = "curta" | "longa" | "inferior" | "calca" | "blusa";

export type PecaKit = {
  chave: PecaChave;
  catalogoId: string;
  nome: string;
  quantidade: number;
};

/** `null` é peça que a família não quer reservar. */
export type TamanhosKit = Record<PecaChave, TamanhoKit | null>;

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

/** Aceita "04" e "g" e devolve o valor da grade, como "4" e "G". */
export function tamanhoKit(valor: string): TamanhoKit | null {
  const limpo = valor.trim().replace(/^tamanho\s+/i, "").replace(/^tam\.?\s*/i, "");
  if (!limpo) return null;
  const normalizado = /^\d+$/.test(limpo) ? limpo.replace(/^0+(?=\d)/, "") : limpo.toUpperCase();
  return GRADE_KIT.has(normalizado) ? (normalizado as TamanhoKit) : null;
}

export function eTamanhoKit(valor: string): valor is TamanhoKit {
  return GRADE_KIT.has(valor);
}

/** Lê o tamanho de uma peça vindo da conversa ou do formulário. `undefined` é valor inválido. */
export function tamanhoOuSem(valor: string): TamanhoKit | null | undefined {
  if (valor === SEM_PECA) return null;
  return eTamanhoKit(valor) ? valor : undefined;
}

/** Um campo por peça, com tamanho ou `SEM_PECA`. `null` se algum valor não for válido. */
export function tamanhosDoFormulario(formData: FormData): TamanhosKit | null {
  const tamanhos: Partial<TamanhosKit> = {};
  for (const chave of ORDEM) {
    const valor = tamanhoOuSem(String(formData.get(chave) ?? ""));
    if (valor === undefined) return null;
    tamanhos[chave] = valor;
  }
  return tamanhos as TamanhosKit;
}

/** Cada peça com tamanho da grade ou fora do kit, e ao menos uma peça reservada. */
export function tamanhosValidos(tamanhos: TamanhosKit) {
  const valores = ORDEM.map((chave) => tamanhos[chave]);
  return valores.every((valor) => valor === null || eTamanhoKit(valor)) && temAlgumaPeca(tamanhos);
}

export function kitCompleto(tamanhos: TamanhosKit) {
  return ORDEM.every((chave) => tamanhos[chave] !== null);
}

export function temAlgumaPeca(tamanhos: TamanhosKit) {
  return ORDEM.some((chave) => tamanhos[chave] !== null);
}

/** O banco guarda masculino/feminino; para a família o kit é "com bermuda" ou "com short-saia". */
export function rotuloKit(kit: KitGenero) {
  return kit === "feminino" ? "Com short-saia" : "Com bermuda";
}

export function descricaoKit(kit: KitGenero) {
  const inferior = kit === "feminino" ? "short-saia" : "bermuda";
  return `2 camisetas manga curta, 1 camiseta manga longa, 1 ${inferior}, 1 calça e 1 blusa de frio.`;
}

export function rotuloTamanho(tamanho: TamanhoKit | null) {
  return tamanho ?? "sem esta peça";
}

export function resumoTamanhos(kit: KitGenero, tamanhos: TamanhosKit) {
  return pecasDoKit(kit)
    .map((peca) => {
      const quantidade = peca.quantidade > 1 ? ` (${peca.quantidade} peças)` : "";
      return `${peca.nome}${quantidade}: ${rotuloTamanho(tamanhos[peca.chave])}`;
    })
    .join("\n");
}
