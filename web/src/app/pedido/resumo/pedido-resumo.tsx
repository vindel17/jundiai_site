"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { AlunoStep } from "@/components/pedido/pedido-steps";
import { usePedidoRascunho } from "@/components/pedido/use-pedido-rascunho";
import { WaIcon } from "@/components/site-topbar";
import { formatBRL, getCatalogItem } from "@/data/catalogo";
import { registrarCompra } from "@/app/conta/indicacao-acoes";
import { getWhatsAppUrl } from "@/lib/constants";
import { pedidoDoRascunho } from "@/lib/pedido-rascunho";
import {
  buildWhatsAppPedidoMessage,
  calcTotalCents,
  splitLines,
  validatePedido,
  type PedidoLine,
} from "@/lib/pedido-state";
import { trackEvent } from "@/lib/utm";

function ResumoLine({ line }: { line: PedidoLine }) {
  const item = getCatalogItem(line.itemId);
  const subtotal = item ? item.priceCents * line.qty : 0;

  return (
    <li>
      {item ? (
        <span className="uj-resumo-thumb">
          <Image src={item.image} alt={item.name} width={180} height={135} />
        </span>
      ) : null}
      <span className="uj-resumo-item">
        {item?.name ?? line.itemId}
        <span>
          Tamanho {line.tamanho} · {line.qty}{" "}
          {line.qty === 1 ? "unidade" : "unidades"}
        </span>
      </span>
      <strong>{line.aguardando ? "Fila de aviso" : formatBRL(subtotal)}</strong>
    </li>
  );
}

export function PedidoResumo({ convite }: { convite?: boolean }) {
  const { rascunho, hidratado, alterar } = usePedidoRascunho();
  const [error, setError] = useState<string | null>(null);

  const pedido = pedidoDoRascunho(rascunho);

  if (!hidratado) {
    return <div className="uj-empty">Carregando…</div>;
  }

  if (pedido.lines.length === 0) {
    return (
      <div className="uj-empty">
        <p>Não encontramos um pedido em andamento.</p>
        <Link href="/comprar" className="btn-primary">
          Montar meu pedido
        </Link>
      </div>
    );
  }

  const total = calcTotalCents(pedido.lines);
  const { comprando, aguardando } = splitLines(pedido.lines);
  const deliveryLabel =
    pedido.delivery === "entrega" ? "Receber em casa" : "Combinar a retirada";

  const waHref = getWhatsAppUrl(buildWhatsAppPedidoMessage(pedido));
  const waConfigured = waHref !== "#";

  function handleConfirm(event: MouseEvent<HTMLAnchorElement>) {
    const validation = validatePedido(pedido);
    if (validation) {
      event.preventDefault();
      setError(validation);
      document.getElementById("fechamento")?.scrollIntoView({ block: "center" });
      return;
    }

    setError(null);
    trackEvent("pedido_whatsapp");
    // Sem await e sem preventDefault: o link precisa abrir no mesmo gesto do
    // toque, senão o Safari trata como popup e bloqueia.
    void registrarCompra(total);
  }

  return (
    <div className="uj-resumo">
      <h1 className="uj-resumo-title">Confira seu pedido</h1>

      <div className="uj-card">
        <div className="uj-resumo-meta">
          <span>
            <strong>Entrega:</strong> {deliveryLabel}
          </span>
          {pedido.fotoNome ? (
            <span>
              <strong>Foto enviada:</strong> {pedido.fotoNome}
            </span>
          ) : null}
        </div>

        <ul className="uj-resumo-list">
          {comprando.map((line) => (
            <ResumoLine key={`${line.itemId}-${line.tamanho}`} line={line} />
          ))}
        </ul>

        <div className="uj-resumo-total">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>

        {aguardando.length > 0 ? (
          <>
            <p className="uj-waiting-title">
              Avisamos você quando estes tamanhos chegarem
            </p>
            <ul className="uj-resumo-list">
              {aguardando.map((line) => (
                <ResumoLine
                  key={`espera-${line.itemId}-${line.tamanho}`}
                  line={line}
                />
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <section className="uj-section" id="fechamento" style={{ padding: 0 }}>
        <div className="uj-step-head" style={{ marginTop: "1.5rem" }}>
          <h2>Para quem é o uniforme?</h2>
        </div>
        <p className="uj-step-hint" style={{ marginLeft: 0 }}>
          Precisamos do nome e da escola para a etiqueta e para o atendimento.
        </p>
        <AlunoStep
          alunoNome={rascunho.alunoNome}
          escola={rascunho.escola}
          onNome={(value) => {
            alterar({ alunoNome: value });
            setError(null);
          }}
          onEscola={(value) => {
            alterar({ escola: value });
            setError(null);
          }}
        />
      </section>

      {error ? (
        <p className="uj-error" role="alert" style={{ marginInline: 0 }}>
          {error}
        </p>
      ) : null}

      {convite ? (
        <p className="uj-help-note" style={{ textAlign: "center" }}>
          Você chegou por um convite.{" "}
          <Link href="/entrar?proximo=/pedido/resumo" className="uj-link">
            Entre antes de confirmar
          </Link>{" "}
          para a família que te chamou somar no placar — e para ganhar as
          etiquetas.
        </p>
      ) : null}

      <p className="uj-help-note" style={{ textAlign: "center" }}>
        Ao confirmar, você fala com a gente no WhatsApp para combinar o
        pagamento e a entrega.
      </p>

      <div className="uj-resumo-actions">
        {waConfigured ? (
          <a
            className="btn-primary btn-gift"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleConfirm}
          >
            <WaIcon /> Confirmar no WhatsApp
          </a>
        ) : (
          <p className="uj-error" style={{ margin: 0 }}>
            Configure o número do WhatsApp para enviar o pedido.
          </p>
        )}
        <Link href="/comprar" className="btn-secondary">
          Voltar e alterar
        </Link>
      </div>
    </div>
  );
}
