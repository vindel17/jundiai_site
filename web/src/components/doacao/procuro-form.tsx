"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarProcuro, type EstadoAcao } from "@/app/doacao/acoes";
import { TAMANHOS } from "@/data/catalogo";
import { DOACAO_MODELOS } from "@/lib/doacao/modelos";

const INICIAL: EstadoAcao = {};

export function ProcuroForm({ logado }: { logado: boolean }) {
  const [estado, acao, pendente] = useActionState(salvarProcuro, INICIAL);

  if (!logado) {
    return (
      <section className="doacao-procuro" aria-labelledby="procuro-title">
        <h2 id="procuro-title">Não achou? Deixe seu aviso</h2>
        <p>
          Diga a peça e o tamanho que você procura e a gente chama você no
          WhatsApp quando alguém doar. Para guardar o aviso, entre primeiro —
          leva 30 segundos, sem senha.
        </p>
        <Link
          href="/entrar?proximo=/doacao/receber"
          className="btn-primary"
          style={{ marginTop: "0.9rem" }}
        >
          Entrar para ser avisado
        </Link>
      </section>
    );
  }

  return (
    <section className="doacao-procuro" aria-labelledby="procuro-title">
      <h2 id="procuro-title">Não achou? Deixe seu aviso</h2>
      <p>
        Diga a peça e o tamanho que você procura. Assim que alguém doar, o aviso
        chega no seu WhatsApp.
      </p>
      <form className="uj-form" action={acao}>
        <div className="uj-field-row">
          <div className="uj-field">
            <label htmlFor="procuro-modelo">Peça</label>
            <select id="procuro-modelo" name="procuro-modelo" required defaultValue="">
              <option value="" disabled>
                Escolha
              </option>
              {DOACAO_MODELOS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="uj-field">
            <label htmlFor="procuro-tamanho">Tamanho</label>
            <select
              id="procuro-tamanho"
              name="procuro-tamanho"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Tam.
              </option>
              {TAMANHOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={pendente}>
          {pendente ? "Salvando..." : "Avise-me quando aparecer"}
        </button>
      </form>
      {estado.ok ? (
        <p className="doacao-ok">
          Pronto. Assim que essa peça aparecer, avisamos no seu WhatsApp. Se
          demorar, mostramos a opção de comprar nova.
        </p>
      ) : null}
      {estado.erro ? <p className="entrar-erro">{estado.erro}</p> : null}
    </section>
  );
}
