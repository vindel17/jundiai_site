"use client";

import { useState } from "react";
import type { Parte } from "@/lib/gabarito/cartao/receitas";
import { FotoMedida } from "./foto-medida";
import { ORDEM_DAS_PARTES, PARTES } from "./partes";
import { ResumoDoKit } from "./resumo-kit";
import { useMedicao } from "./use-medicao";

/** Duas fotos, uma da parte de cima e uma da parte de baixo, e o tamanho sugerido para cada peça do kit. */
export function MedirComCartao() {
  const [parte, setParte] = useState<Parte>("cima");
  const medicoes = { cima: useMedicao("cima"), baixo: useMedicao("baixo") };

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Parte do kit a fotografar" className="flex flex-wrap gap-2">
        {ORDEM_DAS_PARTES.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={p === parte}
            onClick={() => setParte(p)}
            className={p === parte ? "btn-primary" : "btn-secondary"}
          >
            {PARTES[p].rotulo}
          </button>
        ))}
      </div>
      {/* As duas ficam montadas: trocar de parte não perde a foto nem as correções da outra. */}
      {ORDEM_DAS_PARTES.map((p) => (
        <div key={p} hidden={p !== parte}>
          <FotoMedida parte={p} medicao={medicoes[p]} />
        </div>
      ))}
      <ResumoDoKit resultados={{ cima: medicoes.cima.resultado, baixo: medicoes.baixo.resultado }} />
    </div>
  );
}
