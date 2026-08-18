"use client";

import { useSyncExternalStore } from "react";
import {
  assinarRascunho,
  atualizarDraft,
  atualizarRascunho,
  rascunhoAtual,
  rascunhoServidor,
} from "@/lib/pedido-rascunho";

const semAssinatura = () => () => {};
const noServidor = () => false;
const noNavegador = () => true;

/** Rascunho do pedido persistido em sessionStorage, igual na loja e no resumo. */
export function usePedidoRascunho() {
  const rascunho = useSyncExternalStore(
    assinarRascunho,
    rascunhoAtual,
    rascunhoServidor,
  );

  // Falso no servidor e durante a hidratação: separa "ainda carregando" de
  // "carrinho vazio" na tela de resumo.
  const hidratado = useSyncExternalStore(
    semAssinatura,
    noNavegador,
    noServidor,
  );

  return {
    rascunho,
    hidratado,
    alterar: atualizarRascunho,
    alterarDraft: atualizarDraft,
  };
}
