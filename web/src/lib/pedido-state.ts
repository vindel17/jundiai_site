/** Cálculo, validação e mensagem do pedido. A persistência fica em pedido-rascunho.ts. */

import { formatBRL, getCatalogItem, type Tamanho } from "@/data/catalogo";

export type DeliveryOption = "entrega" | "retirada";

export type PedidoLine = {
  itemId: string;
  qty: number;
  tamanho: Tamanho;
  /** Tamanho sem previsão: entra na fila de aviso e não soma no total */
  aguardando?: boolean;
};

export type PedidoState = {
  alunoNome: string;
  escola: string;
  lines: PedidoLine[];
  delivery: DeliveryOption;
  /** Nome do arquivo anexado (opcional); upload real fica para depois */
  fotoNome?: string;
};

export function calcTotalCents(lines: PedidoLine[]): number {
  return lines.reduce((sum, line) => {
    const item = getCatalogItem(line.itemId);
    if (!item || line.aguardando) return sum;
    return sum + item.priceCents * line.qty;
  }, 0);
}

export function splitLines(lines: PedidoLine[]) {
  return {
    comprando: lines.filter((line) => !line.aguardando),
    aguardando: lines.filter((line) => line.aguardando),
  };
}

/** Valida só o carrinho (peças e tamanhos). Nome/escola entram no fechamento. */
export function validateCarrinho(state: PedidoState): string | null {
  if (state.lines.length === 0) return "Selecione pelo menos uma peça.";
  for (const line of state.lines) {
    if (!line.tamanho) return "Escolha o tamanho de cada peça marcada.";
    if (line.qty < 1) return "Quantidade inválida.";
    if (!getCatalogItem(line.itemId)) return "Item inválido no pedido.";
  }
  return null;
}

/** Valida o que falta para fechar: aluno + escola + carrinho. */
export function validatePedido(state: PedidoState): string | null {
  if (!state.alunoNome.trim()) return "Informe o nome do aluno.";
  if (!state.escola.trim()) return "Selecione a escola.";
  return validateCarrinho(state);
}

function describeLine(line: PedidoLine, withPrice: boolean): string {
  const item = getCatalogItem(line.itemId);
  const name = item?.name ?? line.itemId;
  const base = `• ${name} — tam. ${line.tamanho} × ${line.qty}`;
  if (!withPrice || !item) return base;
  return `${base} (${formatBRL(item.priceCents * line.qty)})`;
}

export function buildWhatsAppPedidoMessage(state: PedidoState): string {
  const { comprando, aguardando } = splitLines(state.lines);
  const delivery =
    state.delivery === "entrega" ? "Entrega em casa" : "Retirada combinada";

  const parts = [
    "Olá! Quero finalizar meu pedido no Uniforme Jundiaí.",
    "",
    `Aluno: ${state.alunoNome}`,
    `Escola: ${state.escola}`,
    `Recebimento: ${delivery}`,
  ];

  if (state.fotoNome) {
    parts.push(`Foto para conferir o tamanho: ${state.fotoNome}`);
  }

  if (comprando.length > 0) {
    parts.push(
      "",
      "Itens:",
      comprando.map((line) => describeLine(line, true)).join("\n"),
      "",
      `Total: ${formatBRL(calcTotalCents(state.lines))}`,
    );
  }

  if (aguardando.length > 0) {
    parts.push(
      "",
      "Quero ser avisado quando chegar:",
      aguardando.map((line) => describeLine(line, false)).join("\n"),
    );
  }

  return parts.join("\n");
}
