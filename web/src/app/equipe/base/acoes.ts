"use server";

import { redirect } from "next/navigation";
import { acessoEquipe } from "@/app/equipe/acesso";
import { salvarBaseBot } from "@/lib/whatsapp/ia/base";

const PAGINA = "/equipe/base";

export async function salvarBase(formData: FormData) {
  const acesso = await acessoEquipe(PAGINA);
  if (acesso.tipo !== "ok" || !acesso.perfis.includes("admin")) redirect(PAGINA);

  let resultado = "salvo";
  try {
    resultado = await salvarBaseBot(acesso.autor, String(formData.get("texto") ?? ""));
  } catch (erro) {
    console.error("Falha ao salvar a base do bot", erro);
    resultado = "falha";
  }
  redirect(`${PAGINA}?resultado=${resultado}`);
}
