import moldesSalvos from "@/data/moldes/camiseta-adulto.json";
import { formaIlustrativa, type MedidaTabela } from "./camiseta";
import { gabaritoEntre, validarForma, type Forma } from "./forma";
import type { Faixa } from "./glb";

/** Largura (axila a axila) e comprimento da camiseta adulto, em cm. */
export const TABELA_CAMISETA_ADULTO = {
  P: { comprimento: 67, largura: 50 },
  M: { comprimento: 69, largura: 54 },
  G: { comprimento: 72, largura: 53.5 },
  GG: { comprimento: 75, largura: 62 },
  G1: { comprimento: 77, largura: 68 },
  G2: { comprimento: 80, largura: 73 },
} as const;

export type TamanhoCamisetaAdulto = keyof typeof TABELA_CAMISETA_ADULTO;

export const TAMANHOS_CAMISETA_ADULTO = Object.keys(
  TABELA_CAMISETA_ADULTO,
) as TamanhoCamisetaAdulto[];

function eTamanhoAdulto(valor: string): valor is TamanhoCamisetaAdulto {
  return valor in TABELA_CAMISETA_ADULTO;
}

/** Contornos tirados de fotos das peças reais, gravados pela página /gabarito/molde. */
const MOLDES: Partial<Record<TamanhoCamisetaAdulto, Forma>> = Object.fromEntries(
  Object.entries(moldesSalvos).flatMap(([tamanho, valor]) => {
    const forma = validarForma(valor);
    return forma && eTamanhoAdulto(tamanho) ? [[tamanho, forma]] : [];
  }),
);

/** Molde da foto quando existir; senão, o contorno estimado pela tabela. */
export function formaAdulto(tamanho: TamanhoCamisetaAdulto): Forma {
  return MOLDES[tamanho] ?? formaIlustrativa(TABELA_CAMISETA_ADULTO[tamanho]);
}

export type MedidaAdulto = MedidaTabela & {
  /** O contorno veio da foto da peça, e não da estimativa */
  real: boolean;
};

/** Medidas mostradas no site: as do molde da foto, quando houver. */
export function tabelaCamisetaAdulto(): Record<TamanhoCamisetaAdulto, MedidaAdulto> {
  return Object.fromEntries(
    TAMANHOS_CAMISETA_ADULTO.map((t) => {
      const { comprimento, largura } = formaAdulto(t);
      return [t, { comprimento, largura, real: Boolean(MOLDES[t]) }];
    }),
  ) as Record<TamanhoCamisetaAdulto, MedidaAdulto>;
}

export function arquivoCamisetaAdulto(tamanho: TamanhoCamisetaAdulto): string {
  return `camiseta-adulto-${tamanho.toLowerCase()}.glb`;
}

export function gabaritoCamisetaAdulto(tamanho: TamanhoCamisetaAdulto): Faixa[] {
  return gabaritoEntre(TAMANHOS_CAMISETA_ADULTO, formaAdulto, tamanho);
}
