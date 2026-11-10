import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EntrarForm } from "@/components/auth/entrar-form";
import { SITE } from "@/lib/constants";
import { rotaInterna } from "@/lib/rotas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre com um código enviado pelo WhatsApp.",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { proximo } = await searchParams;
  const destino = rotaInterna(proximo) ?? "/conta";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(destino);

  return (
    <AppShell>
      <main className="entrar-page">
        <span className="uj-kicker">Rede municipal de {SITE.city}</span>
        <h1 className="entrar-title">Entre com seu WhatsApp</h1>
        <p className="entrar-lead">
          Digite seu número para receber o código de acesso.
        </p>

        <EntrarForm proximo={destino} />

        <p className="entrar-privacidade">
          Ao entrar você aceita a{" "}
          <Link href="/privacidade">política de privacidade</Link>.
        </p>
      </main>
    </AppShell>
  );
}
