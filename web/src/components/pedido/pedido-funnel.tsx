"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { CATALOGO, formatBRL, type Tamanho } from "@/data/catalogo";
import { SITE } from "@/lib/constants";
import {
  linhasDoRascunho,
  pedidoDoRascunho,
} from "@/lib/pedido-rascunho";
import {
  calcTotalCents,
  splitLines,
  validateCarrinho,
} from "@/lib/pedido-state";
import { trackEvent } from "@/lib/utm";
import { useHelpWhatsApp } from "@/components/site-topbar";
import { PedidoHero } from "./pedido-hero";
import { PedidoItemList } from "./pedido-item-list";
import { EntregaStep, IncludedBanner } from "./pedido-steps";
import { SizeGuide } from "./size-guide";
import { usePedidoRascunho } from "./use-pedido-rascunho";

type NextAction =
  | { kind: "guide"; label: string; target: string; message: string }
  | { kind: "finish"; label: string };

type Props = {
  provaSocial?: ReactNode;
};

export function PedidoFunnel({ provaSocial }: Props) {
  const router = useRouter();
  const help = useHelpWhatsApp();
  const { rascunho, alterar, alterarDraft } = usePedidoRascunho();
  const [error, setError] = useState<string | null>(null);
  const [showSizeWarning, setShowSizeWarning] = useState(false);

  const { draft, delivery, fotoNome } = rascunho;
  const lines = useMemo(() => linhasDoRascunho(draft), [draft]);

  const selectedCount = Object.values(draft).filter((row) => row.selected).length;
  const totalCents = calcTotalCents(lines);
  const { comprando, aguardando } = splitLines(lines);
  const totalPieces = comprando.reduce((sum, line) => sum + line.qty, 0);

  const nextAction: NextAction = useMemo(() => {
    if (selectedCount === 0) {
      return {
        kind: "guide",
        label: "Escolher as peças",
        target: "passo-1",
        message: "Escolha pelo menos uma peça do uniforme.",
      };
    }
    const semTamanho = CATALOGO.find(
      (item) => draft[item.id].selected && !draft[item.id].tamanho,
    );
    if (semTamanho) {
      return {
        kind: "guide",
        label: "Falta escolher o tamanho",
        target: `item-${semTamanho.id}`,
        message: `Escolha o tamanho de: ${semTamanho.name}.`,
      };
    }
    return { kind: "finish", label: "Ver meu pedido" };
  }, [selectedCount, draft]);

  const progress = [selectedCount > 0, nextAction.kind === "finish"];

  function clearError() {
    setError(null);
  }

  function toggleItem(id: string) {
    alterarDraft((prev) => {
      const row = prev[id];
      const selected = !row.selected;
      return {
        ...prev,
        [id]: {
          ...row,
          selected,
          tamanho: selected ? row.tamanho : "",
          qty: selected ? Math.max(1, row.qty) : 1,
        },
      };
    });
    clearError();
  }

  function changeQty(id: string, delta: number) {
    alterarDraft((prev) => {
      const row = prev[id];
      if (!row.selected) return prev;
      return { ...prev, [id]: { ...row, qty: Math.max(1, row.qty + delta) } };
    });
  }

  function setTamanho(id: string, tamanho: Tamanho) {
    alterarDraft((prev) => ({ ...prev, [id]: { ...prev[id], tamanho } }));
    clearError();
  }

  function handleAdvance() {
    if (nextAction.kind === "guide") {
      setShowSizeWarning(nextAction.target.startsWith("item-"));
      setError(nextAction.message);
      document
        .getElementById(nextAction.target)
        ?.scrollIntoView({ block: "center" });
      return;
    }

    const validation = validateCarrinho(pedidoDoRascunho(rascunho));
    if (validation) {
      setError(validation);
      return;
    }

    trackEvent("pedido_resumo");
    router.push("/pedido/resumo");
  }

  return (
    <>
      <PedidoHero />

      <section className="uj-section" id="passo-1">
        <div className="uj-step-head">
          <span className="uj-step-num">1</span>
          <h2>Escolha as peças</h2>
        </div>
        <p className="uj-step-hint">
          Toque em “Escolher” e depois marque o tamanho.
        </p>
        <PedidoItemList
          draft={draft}
          showSizeWarning={showSizeWarning}
          onToggle={toggleItem}
          onQty={changeQty}
          onTamanho={setTamanho}
        />
        <SizeGuide
          fotoNome={fotoNome}
          onFoto={(nome) => alterar({ fotoNome: nome })}
        />
      </section>

      {provaSocial}

      <section className="uj-section" id="passo-2">
        <div className="uj-step-head">
          <span className="uj-step-num">2</span>
          <h2>Como você quer receber?</h2>
        </div>
        <EntregaStep
          delivery={delivery}
          onDelivery={(value) => alterar({ delivery: value })}
        />
      </section>

      <IncludedBanner />

      {error ? (
        <p className="uj-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="uj-trust">
        <div className="uj-trust-badges">
          <span className="uj-trust-badge">✓ Troca de tamanho</span>
          <span className="uj-trust-badge">✓ Atendimento no WhatsApp</span>
          <span className="uj-trust-badge">✓ Feito em {SITE.city}</span>
        </div>
        <p>
          Ficou com dúvida em qualquer parte?{" "}
          {help.enabled ? (
            <a
              href={help.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("click_whatsapp")}
            >
              Fale com a gente no WhatsApp
            </a>
          ) : (
            "Fale com a gente no WhatsApp."
          )}
        </p>
      </div>

      <div className="uj-sticky">
        <div className="uj-progress" aria-hidden>
          {progress.map((done, index) => (
            <span key={index} className={done ? "done" : undefined} />
          ))}
        </div>
        <div className="uj-sticky-row">
          <span className="uj-total">
            <span className="uj-total-label">
              {totalPieces > 0
                ? `${totalPieces} ${totalPieces === 1 ? "peça" : "peças"}`
                : "Nenhuma peça ainda"}
              {aguardando.length > 0
                ? ` · ${aguardando.length} na fila de aviso`
                : ""}
            </span>
            <span className="uj-total-value">{formatBRL(totalCents)}</span>
          </span>
          <button type="button" className="btn-primary" onClick={handleAdvance}>
            {nextAction.label}
          </button>
        </div>
      </div>
    </>
  );
}
