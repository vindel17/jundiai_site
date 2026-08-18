import type { Metadata } from "next";
import Link from "next/link";
import { AvaliacaoForm } from "@/components/prova-social/avaliacao-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Avaliar compra",
  description:
    "Deixe sua nota, um comentário e fotos do uniforme. Ajuda outras famílias a escolher.",
};

type Props = {
  searchParams: Promise<{ modelo?: string }>;
};

export default async function AvaliarPage({ searchParams }: Props) {
  const { modelo } = await searchParams;
  let logado = false;

  if (supabaseConfigurado) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    logado = Boolean(user);
  }

  return (
    <main className="uj-page">
      <Link href="/conta" className="uj-back">
        ← Minha conta
      </Link>
      <h1 className="uj-page-title">Como ficou o uniforme?</h1>
      <p className="uj-page-lead">
        Nota de 1 a 5, um comentário e, se quiser, fotos. Só quem já comprou
        deve avaliar — assim outras famílias confiam no que leem.
      </p>
      <AvaliacaoForm modeloPadrao={modelo} logado={logado} />
    </main>
  );
}
