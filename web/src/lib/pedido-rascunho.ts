/**
 * Rascunho do pedido: fonte única do que o usuário montou na loja.
 * Fica em sessionStorage para sobreviver a voltar do resumo, recarregar a
 * página ou sair para o WhatsApp e retornar.
 */

import {
  CATALOGO,
  TAMANHOS,
  getDisponibilidade,
  type Tamanho,
} from "@/data/catalogo";
import type { DeliveryOption, PedidoLine, PedidoState } from "./pedido-state";

const CHAVE = "uniforme-jundiai-rascunho";
const QTD_MAX = 20;
const TAMANHOS_OK = new Set<string>(TAMANHOS);

export type DraftLine = {
  selected: boolean;
  qty: number;
  tamanho: Tamanho | "";
};

export type DraftMap = Record<string, DraftLine>;

export type Rascunho = {
  draft: DraftMap;
  delivery: DeliveryOption;
  /** Nome do arquivo anexado (opcional); upload real fica para depois */
  fotoNome?: string;
  alunoNome: string;
  escola: string;
};

export function draftVazio(): DraftMap {
  return Object.fromEntries(
    CATALOGO.map((item) => [
      item.id,
      { selected: false, qty: 1, tamanho: "" as const },
    ]),
  );
}

export function rascunhoVazio(): Rascunho {
  return {
    draft: draftVazio(),
    delivery: "entrega",
    alunoNome: "",
    escola: "",
  };
}

/** Só entra no pedido a peça marcada que já tem tamanho escolhido. */
export function linhasDoRascunho(draft: DraftMap): PedidoLine[] {
  return CATALOGO.flatMap((item) => {
    const row = draft[item.id];
    if (!row?.selected || !row.tamanho) return [];
    const tamanho = row.tamanho;
    return [
      {
        itemId: item.id,
        qty: row.qty,
        tamanho,
        aguardando: getDisponibilidade(item.id, tamanho).status === "espera",
      },
    ];
  });
}

export function pedidoDoRascunho(rascunho: Rascunho): PedidoState {
  return {
    alunoNome: rascunho.alunoNome.trim(),
    escola: rascunho.escola,
    lines: linhasDoRascunho(rascunho.draft),
    delivery: rascunho.delivery,
    fotoNome: rascunho.fotoNome,
  };
}

function quantidadeValida(valor: unknown): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return 1;
  return Math.min(Math.max(Math.trunc(valor), 1), QTD_MAX);
}

/** Ignora item que saiu do catálogo e tamanho que não existe mais. */
function draftSanitizado(bruto: unknown): DraftMap {
  const draft = draftVazio();
  if (!bruto || typeof bruto !== "object") return draft;

  const salvo = bruto as Record<string, Partial<DraftLine> | undefined>;
  for (const id of Object.keys(draft)) {
    const row = salvo[id];
    if (!row) continue;
    const tamanho =
      typeof row.tamanho === "string" && TAMANHOS_OK.has(row.tamanho)
        ? (row.tamanho as Tamanho)
        : "";
    draft[id] = {
      selected: row.selected === true,
      qty: quantidadeValida(row.qty),
      tamanho,
    };
  }
  return draft;
}

function texto(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.slice(0, max) : "";
}

function lerRascunho(): Rascunho | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CHAVE);
  if (!raw) return null;

  try {
    const salvo = JSON.parse(raw) as Partial<Rascunho>;
    return {
      draft: draftSanitizado(salvo.draft),
      delivery: salvo.delivery === "retirada" ? "retirada" : "entrega",
      fotoNome: typeof salvo.fotoNome === "string" ? salvo.fotoNome : undefined,
      alunoNome: texto(salvo.alunoNome, 120),
      escola: texto(salvo.escola, 160),
    };
  } catch {
    return null;
  }
}

function gravarRascunho(rascunho: Rascunho): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(rascunho));
  } catch {
    // Aba privada ou cota cheia: segue sem persistir em vez de quebrar a tela.
  }
}

/* ---------- Store observável, compartilhado pela loja e pelo resumo ---------- */

const RASCUNHO_SSR: Rascunho = rascunhoVazio();
const ouvintes = new Set<() => void>();
let atual: Rascunho | null = null;

export function assinarRascunho(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

/** Identidade estável: a referência só muda quando o rascunho muda. */
export function rascunhoAtual(): Rascunho {
  if (typeof window === "undefined") return RASCUNHO_SSR;
  atual ??= lerRascunho() ?? rascunhoVazio();
  return atual;
}

export function rascunhoServidor(): Rascunho {
  return RASCUNHO_SSR;
}

function aplicar(proximo: Rascunho): void {
  atual = proximo;
  gravarRascunho(proximo);
  for (const ouvinte of ouvintes) ouvinte();
}

export function atualizarRascunho(patch: Partial<Rascunho>): void {
  aplicar({ ...rascunhoAtual(), ...patch });
}

export function atualizarDraft(
  atualizar: (draft: DraftMap) => DraftMap,
): void {
  const base = rascunhoAtual();
  aplicar({ ...base, draft: atualizar(base.draft) });
}
