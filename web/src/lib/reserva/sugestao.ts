import { TAMANHOS_KIT, type TamanhoKit } from "./kit";

type Grade = { valores: Record<TamanhoKit, readonly [number, number]> };

export type Sugestao = {
  /** `null` quando a peça medida é maior que o maior tamanho da grade */
  tamanho: TamanhoKit | null;
  /** Quanto o tamanho sugerido passa de cada medida, em cm, na ordem da grade */
  folga: [number, number] | null;
};

/**
 * Tamanho a comprar para uma peça que já serve bem: o menor da grade que
 * não fica menor que ela em nenhuma medida. Quando a peça cai entre dois
 * tamanhos, sai o maior. `tolerancia` é o quanto, em cm, a peça pode passar
 * do tamanho sem subir para o próximo: cobre o erro da medição.
 * `medidas` segue a ordem da grade.
 */
export function sugerirTamanho(grade: Grade, medidas: readonly [number, number], tolerancia = 1): Sugestao {
  for (const tamanho of TAMANHOS_KIT) {
    const valores = grade.valores[tamanho];
    if (valores.every((valor, i) => valor >= medidas[i] - tolerancia)) {
      return { tamanho, folga: [valores[0] - medidas[0], valores[1] - medidas[1]] };
    }
  }
  return { tamanho: null, folga: null };
}
