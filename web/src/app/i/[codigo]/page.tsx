import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SITE } from "@/lib/constants";
import { CODIGO_INDICACAO } from "@/lib/indicacao/regras";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Convite",
  description:
    "Crie conta, complete o nome do aluno e ganhe 1 etiqueta. Na primeira compra, são 5.",
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

  const entrar = `/entrar?proximo=${encodeURIComponent("/conta")}`;

  return (
    <AppShell>
      <main className="uj-page">
        <span className="uj-kicker">Rede municipal de {SITE.city}</span>
        <h1 className="uj-page-title">Uma família da rede te chamou</h1>
        <p className="uj-page-lead">
          Quem chega por este link cria conta, coloca o nome do aluno e ganha{" "}
          <b>1 etiqueta</b> com o nome. Na primeira compra, são <b>5</b>. Depois
          você também ganha o próprio link para chamar outras famílias.
        </p>

        <ul className="uj-checklist">
          <li>
            <span className="uj-check" aria-hidden>
              ✓
            </span>
            <span>
              <b>Sem código no pedido</b> — o convite já ficou salvo neste
              aparelho por 30 dias.
            </span>
          </li>
          <li>
            <span className="uj-check" aria-hidden>
              ✓
            </span>
            <span>
              <b>A compra pode ser depois</b> — criar a conta agora já vale.
            </span>
          </li>
        </ul>

        <div className="conta-acoes" style={{ marginTop: "1.2rem" }}>
          <Link href={entrar} className="btn-primary">
            Entrar com WhatsApp
          </Link>
          <Link href="/comprar">Ver o uniforme</Link>
          <Link href="/">Quero doar ou receber</Link>
        </div>
      </main>
    </AppShell>
  );
}
