import type { Medidas } from "@/lib/gabarito/cartao/receita";
import type { Parte } from "@/lib/gabarito/cartao/receitas";
import { ORDEM_DAS_PARTES, PARTES, pecasDaParte, sugestaoDaParte } from "./partes";

type Props = { resultados: Record<Parte, Medidas | null> };

function tamanhoDaParte(parte: Parte, medidas: Medidas | null): string {
  if (!medidas) return `falta a foto da ${PARTES[parte].nome}`;
  const tamanho = sugestaoDaParte(parte, medidas)?.tamanho;
  return tamanho ? `tamanho ${tamanho}` : "maior que o G, o maior tamanho da grade";
}

/** O tamanho sugerido para cada peça do kit, a partir das duas fotos. */
export function ResumoDoKit({ resultados }: Props) {
  return (
    <section aria-labelledby="resumo-do-kit" className="flex flex-col gap-2">
      <h2 id="resumo-do-kit" className="text-lg font-bold">
        Tamanhos sugeridos para o kit
      </h2>
      <ul className="flex flex-col gap-1">
        {ORDEM_DAS_PARTES.flatMap((parte) =>
          pecasDaParte(parte).map((peca) => (
            <li key={peca}>
              {peca}: <b>{tamanhoDaParte(parte, resultados[parte])}</b>
            </li>
          )),
        )}
      </ul>
    </section>
  );
}
