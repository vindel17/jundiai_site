"use server";

import { redirect } from "next/navigation";
import { acessoEquipe } from "@/app/equipe/acesso";
import { atualizarReserva } from "@/lib/reserva/consultas";
import { eEntrega } from "@/lib/reserva/entrega";
import { pode } from "@/lib/reserva/equipe";
import { podeTransitar } from "@/lib/reserva/gestao";
import { tamanhosDoFormulario, temAlgumaPeca } from "@/lib/reserva/kit";
import { aplicarMudancaStatus, statusDasReservas } from "@/lib/reserva/mudanca";
import { eStatusReserva } from "@/lib/reserva/status";

const UUID = /^[0-9a-f-]{36}$/i;
const VOLTA = /^\/equipe\/reservas(\/[0-9a-f-]{36})?$/i;

function destino(volta: string, consulta: string, extra: Record<string, string>) {
  const segura = VOLTA.test(volta) ? volta : "/equipe/reservas";
  const params = new URLSearchParams(consulta.slice(0, 500));
  for (const chave of ["salvo", "erro", "mudou", "pulou"]) params.delete(chave);
  for (const [chave, valor] of Object.entries(extra)) if (valor) params.set(chave, valor);
  const texto = params.toString();
  return texto ? `${segura}?${texto}` : segura;
}

export async function salvarReserva(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/equipe/reservas");

  const acesso = await acessoEquipe(`/equipe/reservas/${id}`);
  if (acesso.tipo !== "ok" || !pode(acesso.perfis, "editar")) {
    redirect(`/equipe/reservas/${id}?erro=acesso`);
  }

  const tamanhos = tamanhosDoFormulario(formData);
  const entrega = String(formData.get("entrega") ?? "");
  if (!tamanhos || !temAlgumaPeca(tamanhos) || !eEntrega(entrega)) {
    redirect(`/equipe/reservas/${id}?erro=tamanho`);
  }

  const resultado = await atualizarReserva(id, tamanhos, entrega);
  if ("motivo" in resultado) redirect(`/equipe/reservas/${id}?erro=${resultado.motivo}`);
  redirect(`/equipe/reservas/${id}?salvo=1`);
}

export async function mudarStatusReservas(formData: FormData) {
  const voltaBruta = String(formData.get("volta") ?? "/equipe/reservas");
  const volta = VOLTA.test(voltaBruta) ? voltaBruta : "/equipe/reservas";
  const consulta = String(formData.get("consulta") ?? "");
  const recusar = (erro: string) => destino(volta, consulta, { erro });

  const acesso = await acessoEquipe(volta);
  if (acesso.tipo !== "ok") redirect(recusar("status"));

  const para = String(formData.get("para") ?? "");
  const ids = [...new Set(formData.getAll("ids").map(String))]
    .filter((id) => UUID.test(id))
    .slice(0, 50);
  if (!eStatusReserva(para) || ids.length === 0) redirect(recusar("status"));

  const observacao = String(formData.get("observacao") ?? "").trim().slice(0, 500);
  const atuais = await statusDasReservas(ids).catch(() => null);
  if (!atuais) redirect(recusar("falha"));
  const permitidas = atuais
    .filter((linha) => podeTransitar(acesso.perfis, linha.status, para))
    .map((linha) => linha.id);
  if (permitidas.length === 0) redirect(recusar("status"));

  const resultado = await aplicarMudancaStatus(permitidas, para, acesso.autor, observacao).catch(
    () => null,
  );
  if (!resultado) redirect(recusar("falha"));
  const mudou = resultado.filter((linha) => linha.mudou).length;
  if (mudou === 0) redirect(recusar("status"));
  const pulou = ids.length - mudou;
  redirect(destino(volta, consulta, { mudou: String(mudou), ...(pulou > 0 ? { pulou: String(pulou) } : {}) }));
}
