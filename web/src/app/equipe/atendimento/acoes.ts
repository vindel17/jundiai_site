"use server";

import { redirect } from "next/navigation";
import { acessoEquipe } from "@/app/equipe/acesso";
import { pode } from "@/lib/reserva/equipe";
import { ATENDIMENTO, ID_ATENDIMENTO, mudarAtendimento, responderAtendimento } from "@/lib/whatsapp/atendimento";

export async function agirNoAtendimento(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!ID_ATENDIMENTO.test(id)) redirect(ATENDIMENTO);

  const destino = `${ATENDIMENTO}?conversa=${id}`;
  const acesso = await acessoEquipe(destino);
  if (acesso.tipo !== "ok" || !pode(acesso.perfis, "atendimento")) redirect(ATENDIMENTO);

  const acao = formData.get("acao");
  let aviso: string;
  try {
    if (acao === "assumir" || acao === "encerrar") {
      const mudou = await mudarAtendimento(id, acesso.autor, acao === "encerrar");
      aviso = mudou ? (acao === "encerrar" ? "encerrado" : "assumido") : "indisponivel";
    } else if (acao === "responder") {
      const texto = String(formData.get("texto") ?? "").trim();
      const mensagem = String(formData.get("mensagem") ?? "");
      aviso = texto && texto.length <= 4096 && ID_ATENDIMENTO.test(mensagem)
        ? await responderAtendimento(id, acesso.autor, mensagem, texto)
        : "texto";
    } else {
      aviso = "indisponivel";
    }
  } catch (erro) {
    console.error("Falha na operação de atendimento", { id, acao, erro });
    aviso = "falha";
  }
  redirect(`${destino}&aviso=${aviso}`);
}
