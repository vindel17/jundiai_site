import type { Metadata } from "next";
import { PedidoResumo } from "./pedido-resumo";
import { codigoDoCookie } from "@/app/conta/indicacao-acoes";
import { SITE } from "@/lib/constants";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Resumo do pedido",
  description: `Confira o resumo do seu pedido de uniforme escolar em ${SITE.city}.`,
  alternates: { canonical: "/pedido/resumo" },
  robots: { index: false, follow: false },
};

export default async function PedidoResumoPage() {
  const convite = Boolean(await codigoDoCookie());
  let logado = false;
  if (supabaseConfigurado) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    logado = Boolean(user);
  }
  return <PedidoResumo convite={convite && !logado} />;
}
