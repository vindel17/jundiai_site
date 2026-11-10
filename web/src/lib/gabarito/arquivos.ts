import { createHash } from "node:crypto";
import {
  TAMANHOS_CAMISETA,
  arquivoCamiseta,
  gabaritoCamiseta,
  type TamanhoCamiseta,
} from "./camiseta";
import {
  TAMANHOS_CAMISETA_ADULTO,
  arquivoCamisetaAdulto,
  gabaritoCamisetaAdulto,
  type TamanhoCamisetaAdulto,
} from "./camiseta-adulto";
import { gradeTeste } from "./desenho";
import { gerarGlb, type Faixa } from "./glb";

/** Arquivos públicos por URL: o Scene Viewer do Android baixa o modelo pelo link. */
export const GABARITOS: Record<string, () => Faixa[]> = {
  "teste-60cm.glb": () => gradeTeste(60),
  ...Object.fromEntries(
    TAMANHOS_CAMISETA.map((t) => [arquivoCamiseta(t), () => gabaritoCamiseta(t)]),
  ),
  ...Object.fromEntries(
    TAMANHOS_CAMISETA_ADULTO.map((t) => [arquivoCamisetaAdulto(t), () => gabaritoCamisetaAdulto(t)]),
  ),
};

export function gerarArquivo(arquivo: string): Uint8Array<ArrayBuffer> | undefined {
  const desenho = GABARITOS[arquivo];
  return desenho ? gerarGlb(desenho()) : undefined;
}

/**
 * Link com versão tirada do conteúdo: quando o desenho muda, o link muda,
 * e o navegador e o visualizador de AR do celular não reaproveitam o modelo antigo.
 */
export function urlGabarito(arquivo: string): string {
  const bytes = gerarArquivo(arquivo);
  if (!bytes) throw new Error(`Gabarito desconhecido: ${arquivo}`);
  const versao = createHash("sha256").update(bytes).digest("hex").slice(0, 10);
  return `/gabaritos/${arquivo}?v=${versao}`;
}

function urlsDe<T extends string>(tamanhos: readonly T[], arquivo: (tamanho: T) => string): Record<T, string> {
  return Object.fromEntries(tamanhos.map((t) => [t, urlGabarito(arquivo(t))])) as Record<T, string>;
}

export function urlsCamiseta(): Record<TamanhoCamiseta, string> {
  return urlsDe(TAMANHOS_CAMISETA, arquivoCamiseta);
}

export function urlsCamisetaAdulto(): Record<TamanhoCamisetaAdulto, string> {
  return urlsDe(TAMANHOS_CAMISETA_ADULTO, arquivoCamisetaAdulto);
}
