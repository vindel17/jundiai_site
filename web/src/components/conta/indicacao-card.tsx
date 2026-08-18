"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { pedirResgate, type EstadoResgate } from "@/app/conta/indicacao-acoes";
import { formatBRL } from "@/data/catalogo";
import {
  FAIXA_CAMISETA_CENTAVOS,
  textoConvite,
} from "@/lib/indicacao/regras";

export type PlacarIndicacao = {
  codigo: string;
  acessos: number;
  cadastros: number;
  pendenteCentavos: number;
  confirmadoCentavos: number;
  camisetas: number;
  faltamCentavos: number;
  etiquetasDtf: number;
  indicado: boolean;
  link: string;
};

const INICIAL: EstadoResgate = {};

export function IndicacaoCard({ placar }: { placar: PlacarIndicacao }) {
  const [copiado, setCopiado] = useState(false);
  const [estado, acao, pendente] = useActionState(pedirResgate, INICIAL);
  const progresso = Math.min(
    100,
    Math.round(
      ((FAIXA_CAMISETA_CENTAVOS - placar.faltamCentavos) / FAIXA_CAMISETA_CENTAVOS) *
        100,
    ),
  );
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
    <section className="conta-card" aria-labelledby="conta-indicacao">
      <div className="conta-card-head">
        <h2 id="conta-indicacao">Compartilhe e Ganhe</h2>
      </div>
      <p className="conta-card-lead">
        Família nova que chegar por este link, criar conta e comprar soma no seu
        placar. A cada {formatBRL(FAIXA_CAMISETA_CENTAVOS)} confirmados você pede
        uma camiseta, entregue em casa.
      </p>

      <div className="indicacao-link">
        <code>{placar.link}</code>
        <button type="button" className="doacao-reset" onClick={copiar}>
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <div className="conta-acoes">
        <a href={waShare} target="_blank" rel="noreferrer">
          Mandar no WhatsApp
        </a>
      </div>

      <ul className="conta-lista">
        <li>
          <b>Acessos ao link</b>
          <span>{placar.acessos}</span>
        </li>
        <li>
          <b>Contas criadas</b>
          <span>{placar.cadastros}</span>
        </li>
        <li>
          <b>Confirmado</b>
          <span>{formatBRL(placar.confirmadoCentavos)}</span>
        </li>
        <li>
          <b>Aguardando 7 dias</b>
          <span>{formatBRL(placar.pendenteCentavos)}</span>
        </li>
        <li>
          <b>Camisetas para resgate</b>
          <span>{placar.camisetas}</span>
        </li>
        {placar.etiquetasDtf > 0 ? (
          <li>
            <b>Suas etiquetas DTF</b>
            <span>{placar.etiquetasDtf}</span>
          </li>
        ) : null}
      </ul>

      <p className="conta-card-lead">
        Faltam {formatBRL(placar.faltamCentavos)} para a próxima camiseta.
      </p>
      <div className="indicacao-barra" aria-hidden>
        <i style={{ width: `${progresso}%` }} />
      </div>

      {placar.camisetas > 0 ? (
        estado.ok ? (
          <p className="doacao-ok">
            Pedido de resgate anotado. Vamos combinar a entrega em casa.
          </p>
        ) : (
          <form className="uj-form" action={acao} style={{ marginTop: "0.9rem" }}>
            <div className="uj-field">
              <label htmlFor="resgate-endereco">
                Endereço para entregar a camiseta
              </label>
              <textarea
                id="resgate-endereco"
                name="endereco"
                rows={3}
                required
                minLength={10}
                placeholder="Rua, número, bairro, Jundiaí"
              />
            </div>
            {estado.erro ? <p className="entrar-erro">{estado.erro}</p> : null}
            <button type="submit" className="btn-primary" disabled={pendente}>
              {pendente ? "Enviando..." : "Pedir resgate"}
            </button>
          </form>
        )
      ) : null}

      {placar.indicado && placar.etiquetasDtf > 0 ? (
        <div className="conta-acoes">
          <Link href="/etiquetas">Pedir minhas etiquetas</Link>
        </div>
      ) : null}
    </section>
  );
}
