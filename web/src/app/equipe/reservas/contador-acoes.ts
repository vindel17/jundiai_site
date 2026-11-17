"use server";

import { redirect } from "next/navigation";
import { acessoEquipe } from "@/app/equipe/acesso";
import { quantidadeDoCampo } from "@/lib/reserva/contador";
import { lancarAjuste } from "@/lib/reserva/contador-consulta";
import { pode } from "@/lib/reserva/equipe";

const PAGINA = "/equipe/reservas";

export async function adicionarAoContador(formData: FormData) {
  const acesso = await acessoEquipe(PAGINA);
  if (acesso.tipo !== "ok" || !pode(acesso.perfis, "contador")) redirect(PAGINA);

  const quantidade = quantidadeDoCampo(String(formData.get("quantidade") ?? ""));
  if (quantidade === null) redirect(`${PAGINA}?contador=invalido`);

  const nota = String(formData.get("nota") ?? "");
  try {
    await lancarAjuste(quantidade, nota, acesso.autor);
  } catch (erro) {
    console.error("Falha ao lançar no contador", erro);
    redirect(`${PAGINA}?contador=falha`);
  }
  redirect(`${PAGINA}?contador=ok`);
}
