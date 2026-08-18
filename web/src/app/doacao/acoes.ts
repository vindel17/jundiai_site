"use server";

/**
 * Porta do site para os comandos de doação.
 *
 * Aqui só entra tradução: FormData na entrada, `redirect`/`revalidatePath` na
 * saída. A regra vive em `lib/comandos/doacao.ts`, compartilhada com o agente
 * do WhatsApp — ver `whatsapp-agente.md` §7.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as doacao from "@/lib/comandos/doacao";
import { executorDoUsuario } from "@/lib/comandos/executor";
import { temFilho } from "@/lib/comandos/perfil";
import type { Executor } from "@/lib/comandos/tipos";

export type EstadoAcao = { erro?: string; ok?: boolean };

function fotoDoFormulario(valor: FormDataEntryValue | null) {
  if (!(valor instanceof File) || valor.size === 0) return null;
  return { conteudo: valor, tipo: valor.type, tamanho: valor.size };
}

export async function publicarAnuncio(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const ex = await executorDoUsuario();
  if (!ex) return { erro: "Sessão expirada. Entre de novo." };
  if (!(await temFilho(ex))) redirect("/conta?proximo=/doacao/doar");

  const resultado = await doacao.publicarAnuncio(ex, {
    modelo: formData.get("modelo"),
    tamanho: formData.get("tamanho"),
    quantidade: formData.get("quantidade"),
    escola: formData.get("escola"),
    estado: formData.get("estado"),
    foto: fotoDoFormulario(formData.get("foto")),
  });

  if (!resultado.ok) return { erro: resultado.erro };

  revalidatePath("/doacao/receber");
  revalidatePath("/conta");
  return { ok: true };
}

export async function pedirPeca(formData: FormData) {
  const ex = await executorDoUsuario();
  if (!ex) redirect("/entrar?proximo=/doacao/receber");
  if (!(await temFilho(ex))) redirect("/conta?proximo=/doacao/receber");

  const resultado = await doacao.pedirPeca(
    ex,
    String(formData.get("anuncioId") || ""),
  );

  if (!resultado.ok) {
    redirect(`/doacao/receber?aviso=${encodeURIComponent(resultado.erro)}`);
  }

  revalidatePath("/conta");
  redirect(`/doacao/pedido/${resultado.dados.doacaoId}`);
}

/** Aceitar/recusar e confirmar entrega voltam para a mesma tela do pedido. */
async function noPedido(
  formData: FormData,
  executar: (ex: Executor, id: string) => Promise<{ ok: boolean; erro?: string }>,
) {
  const ex = await executorDoUsuario();
  if (!ex) redirect("/entrar");

  const id = String(formData.get("doacaoId") || "");
  const resultado = await executar(ex, id);

  if (!resultado.ok) {
    redirect(`/doacao/pedido/${id}?aviso=${encodeURIComponent(resultado.erro ?? "")}`);
  }

  revalidatePath("/conta");
  revalidatePath(`/doacao/pedido/${id}`);
  redirect(`/doacao/pedido/${id}`);
}

export async function responderPedido(formData: FormData) {
  const aceitar = formData.get("aceitar") === "1";
  return noPedido(formData, (ex, id) =>
    doacao.responderPedido(ex, id, aceitar),
  );
}

export async function confirmarEntrega(formData: FormData) {
  return noPedido(formData, (ex, id) => doacao.confirmarEntrega(ex, id));
}

export async function salvarProcuro(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const ex = await executorDoUsuario();
  if (!ex) return { erro: "Entre com seu WhatsApp para receber o aviso." };
  if (!(await temFilho(ex))) redirect("/conta?proximo=/doacao/receber");

  const resultado = await doacao.salvarProcuro(ex, {
    modelo: formData.get("procuro-modelo"),
    tamanho: formData.get("procuro-tamanho"),
  });

  if (!resultado.ok) return { erro: resultado.erro };

  revalidatePath("/conta");
  return { ok: true };
}
