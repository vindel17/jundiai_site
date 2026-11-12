"use client";

import { useState } from "react";
import {
  faltamParaProximaCamiseta,
  passoDoTrio,
  PESSOAS_POR_PECA_EXTRA,
  textoConvite,
} from "@/lib/indicacao/regras";

export type PlacarReserva = {
  link: string;
  reservaram: number;
  ultimaEm: string | null;
};

function dataPorExtenso(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function fraseDoPlacar(reservaram: number) {
  if (reservaram === 0) {
    return "Nenhuma família reservou pelo seu link ainda. A primeira já conta.";
  }

  const familias =
    reservaram === 1
      ? "1 família já reservou pelo seu link."
      : `${reservaram} famílias já reservaram pelo seu link.`;
  const faltam = faltamParaProximaCamiseta(reservaram);
  if (reservaram % PESSOAS_POR_PECA_EXTRA === 0) {
    return `${familias} Trio fechado: a camiseta extra sai quando elas comprarem o kit. Faltam mais ${faltam} para outra.`;
  }
  const falta = faltam === 1 ? "Falta 1 família" : `Faltam ${faltam} famílias`;
  return `${familias} ${falta} para a sua camiseta extra.`;
}

export function IndicacaoCard({ placar }: { placar: PlacarReserva }) {
  const [copiado, setCopiado] = useState(false);
  const passo = passoDoTrio(placar.reservaram);
  const progresso = Math.round((passo / PESSOAS_POR_PECA_EXTRA) * 100);
  const waShare = `https://wa.me/?text=${encodeURIComponent(textoConvite(placar.link))}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(placar.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section className="conta-card indicacao-destaque" aria-labelledby="conta-indicacao">
      <h2 id="conta-indicacao">Ganhe uma camiseta extra</h2>
      <p className="conta-card-lead">
        Mande este link. A cada {PESSOAS_POR_PECA_EXTRA} famílias que reservarem o
        uniforme por ele e comprarem o kit, a camiseta é sua.
      </p>

      <div className="indicacao-link">
        <code>{placar.link}</code>
        <button type="button" className="conta-texto-acao" onClick={copiar}>
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <div className="conta-acoes">
        <a className="btn-primary" href={waShare} target="_blank" rel="noreferrer">
          Mandar no WhatsApp
        </a>
      </div>

      <p className="indicacao-passo">{fraseDoPlacar(placar.reservaram)}</p>
      {placar.ultimaEm ? (
        <p className="indicacao-meta">A última reserva foi em {dataPorExtenso(placar.ultimaEm)}.</p>
      ) : null}
      <p className="indicacao-meta">
        {passo} de {PESSOAS_POR_PECA_EXTRA} para a próxima camiseta
      </p>
      <div
        className="indicacao-barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={PESSOAS_POR_PECA_EXTRA}
        aria-valuenow={passo}
        aria-label="Famílias do trio atual"
      >
        <i style={{ width: `${progresso}%` }} />
      </div>
    </section>
  );
}
