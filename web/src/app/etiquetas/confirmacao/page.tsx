import Link from "next/link";
import { SiteFooter } from "@/components/site-chrome";
import { SiteTopbar, WhatsAppFab } from "@/components/site-topbar";
import { SITE, getWhatsAppUrl } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitação recebida",
};

type Props = {
  searchParams: Promise<{ filhos?: string; etiquetas?: string }>;
};

export default async function ConfirmacaoPage({ searchParams }: Props) {
  const params = await searchParams;
  const filhos = Number(params.filhos ?? "1") || 1;
  const etiquetas =
    Number(params.etiquetas ?? String(filhos * SITE.etiquetasPorFilho)) ||
    filhos * SITE.etiquetasPorFilho;
  const wa = getWhatsAppUrl(
    "Olá! Acabei de pedir as etiquetas com o nome do aluno no site e gostaria de confirmar.",
  );

  return (
    <>
      <SiteTopbar />
      <main id="conteudo" tabIndex={-1} className="section-block">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <p className="eyebrow">Pronto</p>
          <h1 className="section-title">Solicitação recebida com sucesso</h1>
          <p className="section-lead mx-auto">
            Registramos o pedido de <strong>{etiquetas} etiquetas</strong> para{" "}
            <strong>
              {filhos} {filhos === 1 ? "filho" : "filhos"}
            </strong>
            . Em breve você receberá a confirmação pelo WhatsApp.
          </p>
          <ul className="mt-8 space-y-3 text-left text-[var(--muted)]">
            <li>• Envio pelos Correios para o endereço informado</li>
            <li>• Prazo estimado: {SITE.prazoEstimado}</li>
            <li>• Avisaremos quando o kit for despachado</li>
          </ul>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {wa !== "#" && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Falar no WhatsApp
              </a>
            )}
            <Link href="/" className="btn-secondary">
              Voltar ao início
            </Link>
          </div>
          <p className="mt-10 text-sm text-[var(--muted)]">
            Tem uniforme que não serve mais em casa?{" "}
            <Link href="/doacao/doar" className="underline underline-offset-2">
              Doe para outra família de {SITE.city}
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
