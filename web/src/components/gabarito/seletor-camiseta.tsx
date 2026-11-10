"use client";

import { useState } from "react";
import { GabaritoAr } from "./gabarito-ar";

type Medida = {
  comprimento: number;
  largura: number;
  /** O contorno veio da foto da peça */
  real?: boolean;
};

type Props<T extends string> = {
  /** Links versionados de cada tamanho, gerados no servidor */
  urls: Record<T, string>;
  tamanhos: readonly T[];
  tabela: Record<T, Medida>;
  inicial: T;
  nome?: string;
};

export function SeletorCamiseta<T extends string>({
  urls,
  tamanhos,
  tabela,
  inicial,
  nome = "camiseta",
}: Props<T>) {
  const [tamanho, setTamanho] = useState<T>(inicial);
  const { comprimento, largura, real } = tabela[tamanho];

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={`Tamanho da ${nome}`} className="flex flex-wrap gap-2">
        {tamanhos.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={t === tamanho}
            onClick={() => setTamanho(t)}
            className={t === tamanho ? "btn-primary" : "btn-secondary"}
          >
            {t}
          </button>
        ))}
      </div>
      <GabaritoAr
        key={tamanho}
        src={urls[tamanho]}
        alt={`Contorno de ${nome} tamanho ${tamanho} em tamanho real`}
      />
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Tamanho {tamanho} em vermelho: comprimento {comprimento} cm e largura de axila a axila{" "}
        {largura} cm. Magenta tracejado é o menor e verde tracejado é o maior.{" "}
        {real ? "Contorno tirado da foto da peça." : "Gola, ombro e manga são estimados."}
      </p>
    </div>
  );
}
