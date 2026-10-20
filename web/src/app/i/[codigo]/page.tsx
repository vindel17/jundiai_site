import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SITE, getWhatsAppUrl } from "@/lib/constants";
import { CODIGO_INDICACAO } from "@/lib/indicacao/regras";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Convite",
  description:
    "Reserve o uniforme escolar de Jundiaí pelo WhatsApp, sem pagar agora.",
  robots: { index: false, follow: false },
};

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  if (!CODIGO_INDICACAO.test(codigo)) notFound();

  if (supabaseConfigurado) {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("registrar_acesso_indicacao", { p_codigo: codigo });
  }

  const entrar = getWhatsAppUrl(`Vim pela indicacao ${codigo}`);

  return (
    <AppShell>
      <main className="uj-page">
        <span className="uj-kicker">Rede municipal de {SITE.city}</span>
        <h1 className="uj-page-title">Uma família te chamou</h1>
        <p className="uj-page-lead">
          Pelo WhatsApp da Uniforme Jundiaí você separa as 6 peças do uniforme,
          escolhe os tamanhos e não paga agora. Quando o kit estiver pronto, avisamos na
          mesma conversa e você decide se deseja comprar.
        </p>

        <div className="conta-acoes" style={{ marginTop: "1.2rem" }}>
          <a className="btn-primary" href={entrar}>
            Reservar no WhatsApp
          </a>
        </div>
      </main>
    </AppShell>
  );
}
