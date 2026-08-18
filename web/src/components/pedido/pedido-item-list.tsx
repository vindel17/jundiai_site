"use client";

import Image from "next/image";
import {
  CATALOGO,
  TAMANHOS,
  describeDisponibilidade,
  formatBRL,
  getDisponibilidade,
  type Tamanho,
} from "@/data/catalogo";
import type { DraftMap } from "@/lib/pedido-rascunho";

type Props = {
  draft: DraftMap;
  showSizeWarning: boolean;
  onToggle: (id: string) => void;
  onQty: (id: string, delta: number) => void;
  onTamanho: (id: string, tamanho: Tamanho) => void;
};

export function PedidoItemList({
  draft,
  showSizeWarning,
  onToggle,
  onQty,
  onTamanho,
}: Props) {
  return (
    <ul className="uj-products">
      {CATALOGO.map((item) => {
        const row = draft[item.id];
        const detailId = `detalhe-${item.id}`;
        const isPhoto =
          item.image.endsWith(".jpg") || item.image.endsWith(".png");
        const disponibilidade = row.tamanho
          ? getDisponibilidade(item.id, row.tamanho)
          : null;
        const aguardando = disponibilidade?.status === "espera";

        return (
          <li
            key={item.id}
            id={`item-${item.id}`}
            className={`uj-product${row.selected ? " selected" : ""}`}
          >
            <div className="uj-product-main">
              <div className="uj-product-img">
                <Image
                  src={item.image}
                  alt={`${item.name} — frente, costas e vista`}
                  width={isPhoto ? 800 : 144}
                  height={isPhoto ? 600 : 144}
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              </div>
              <div className="uj-product-body">
                <div className="uj-product-info">
                  <h3 className="uj-product-name">{item.name}</h3>
                  <p className="uj-product-hint">{item.hint}</p>
                  <p className="uj-product-price">
                    {formatBRL(item.priceCents)}
                  </p>
                </div>
                <button
                  type="button"
                  className={`uj-add-btn${row.selected ? " is-added" : ""}`}
                  aria-expanded={row.selected}
                  aria-controls={detailId}
                  onClick={() => onToggle(item.id)}
                >
                  {row.selected ? "Remover" : "Escolher"}
                </button>
              </div>
            </div>

            {row.selected ? (
              <div className="uj-product-detail" id={detailId}>
                <p className="uj-detail-label">Qual o tamanho?</p>
                <div
                  className="uj-sizes"
                  role="group"
                  aria-label={`Tamanho de ${item.name}`}
                >
                  {TAMANHOS.map((t) => {
                    const situacao = getDisponibilidade(item.id, t);
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`uj-size uj-size-${situacao.status}${
                          row.tamanho === t ? " active" : ""
                        }`}
                        aria-pressed={row.tamanho === t}
                        onClick={() => onTamanho(item.id, t)}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                {showSizeWarning && !row.tamanho ? (
                  <p className="uj-size-missing">Falta escolher o tamanho</p>
                ) : null}

                {disponibilidade ? (
                  <p className={`uj-availability uj-availability-${disponibilidade.status}`}>
                    {describeDisponibilidade(disponibilidade)}
                  </p>
                ) : null}

                <div className="uj-qty-row">
                  <div className="uj-qty">
                    <button
                      type="button"
                      aria-label={`Diminuir quantidade de ${item.name}`}
                      disabled={row.qty <= 1}
                      onClick={() => onQty(item.id, -1)}
                    >
                      −
                    </button>
                    <span className="uj-qty-value" aria-live="polite">
                      {row.qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar quantidade de ${item.name}`}
                      onClick={() => onQty(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="uj-line-total">
                    {aguardando
                      ? "Fila de aviso"
                      : formatBRL(item.priceCents * row.qty)}
                  </span>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
