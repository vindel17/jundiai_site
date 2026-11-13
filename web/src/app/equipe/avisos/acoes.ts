"use server";

import { redirect } from "next/navigation";
import { acessoEquipe } from "@/app/equipe/acesso";
import {
  envioVoucherConfigurado,
  enviarLoteVoucher,
  prepararAvisoVoucher,
  recolocarAvisosRecusados,
} from "@/lib/reserva/aviso-voucher";

const PAGINA = "/equipe/avisos";

async function autorDoAviso(formData: FormData) {
  const acesso = await acessoEquipe(PAGINA);
  if (acesso.tipo !== "ok" || !acesso.perfis.includes("admin")) redirect(PAGINA);
  if (!envioVoucherConfigurado()) redirect(PAGINA + "?resultado=indisponivel");
  if (formData.get("liberado") !== "sim") redirect(PAGINA + "?resultado=confirmar");
  return acesso.autor;
}

export async function prepararFilaVoucher(quantidade: number, formData: FormData) {
  const autor = await autorDoAviso(formData);
  if (!Number.isSafeInteger(quantidade) || quantidade < 1) redirect(PAGINA + "?resultado=atualizar");
  const preparadas = await prepararAvisoVoucher(autor, quantidade).catch((erro: unknown) => {
    console.error("Falha ao preparar a fila do voucher", erro);
    return null;
  });
  const resultado = preparadas === null ? "falha" : preparadas === quantidade ? "preparado" : "atualizar";
  redirect(PAGINA + "?resultado=" + resultado);
}

export async function dispararLoteVoucher(ids: string[], formData: FormData) {
  const autor = await autorDoAviso(formData);
  const lote = await enviarLoteVoucher(autor, ids).catch((erro: unknown) => {
    console.error("Falha no lote do aviso do voucher", erro);
    return null;
  });
  const resultado = !lote || lote.interrompido ? "interrompido" : "processado";
  redirect(PAGINA + "?resultado=" + resultado);
}

export async function recolocarRecusados(formData: FormData) {
  const autor = await autorDoAviso(formData);
  const recolocados = await recolocarAvisosRecusados(autor).catch((erro: unknown) => {
    console.error("Falha ao recolocar avisos recusados do voucher", erro);
    return null;
  });
  redirect(PAGINA + (recolocados === null ? "?resultado=falha" : "?resultado=recolocado"));
}
