"use client";

import { ESCOLAS_JUNDIAI } from "@/data/escolas";
import { SITE } from "@/lib/constants";
import type { DeliveryOption } from "@/lib/pedido-state";

type AlunoProps = {
  alunoNome: string;
  escola: string;
  onNome: (value: string) => void;
  onEscola: (value: string) => void;
};

export function AlunoStep({ alunoNome, escola, onNome, onEscola }: AlunoProps) {
  return (
    <div className="uj-card">
      <div className="uj-field">
        <label htmlFor="aluno">Nome do aluno</label>
        <input
          id="aluno"
          type="text"
          placeholder="Ex: Maria Souza"
          value={alunoNome}
          onChange={(e) => onNome(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div className="uj-field">
        <label htmlFor="escola">Escola onde estuda</label>
        <select
          id="escola"
          value={escola}
          onChange={(e) => onEscola(e.target.value)}
        >
          <option value="">Toque para escolher</option>
          {ESCOLAS_JUNDIAI.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type EntregaProps = {
  delivery: DeliveryOption;
  onDelivery: (value: DeliveryOption) => void;
};

export function EntregaStep({ delivery, onDelivery }: EntregaProps) {
  return (
    <>
      <div>
        <button
          type="button"
          className={`uj-option${delivery === "entrega" ? " active" : ""}`}
          aria-pressed={delivery === "entrega"}
          onClick={() => onDelivery("entrega")}
        >
          <span className="uj-radio" aria-hidden />
          <span>
            <span className="uj-option-title">Receber em casa</span>
            <span className="uj-option-sub">
              Entregamos no seu endereço, em {SITE.city}
            </span>
            <span className="uj-tag">mais escolhido</span>
          </span>
        </button>
        <button
          type="button"
          className={`uj-option${delivery === "retirada" ? " active" : ""}`}
          aria-pressed={delivery === "retirada"}
          onClick={() => onDelivery("retirada")}
        >
          <span className="uj-radio" aria-hidden />
          <span>
            <span className="uj-option-title">Combinar a retirada</span>
            <span className="uj-option-sub">
              A gente combina com você pelo WhatsApp
            </span>
          </span>
        </button>
      </div>
    </>
  );
}

export function IncludedBanner() {
  return (
    <section className="uj-included" aria-labelledby="uj-included-title">
      <p className="eyebrow">Já vem junto</p>
      <h2 id="uj-included-title">Etiqueta com o nome do aluno</h2>
      <p>
        Quem compra o uniforme com a gente recebe etiquetas com o nome da
        criança e um código exclusivo.
      </p>
      <ul>
        <li>O nome fica na peça: fica mais fácil achar na escola</li>
        <li>Sem telefone escrito na roupa</li>
        <li>Se alguém encontrar a peça, a família é avisada</li>
      </ul>
    </section>
  );
}
