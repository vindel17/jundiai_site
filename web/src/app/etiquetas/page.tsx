import { Suspense } from "react";
import { SiteFooter } from "@/components/site-chrome";
import { SiteTopbar, WhatsAppFab } from "@/components/site-topbar";
import {
  AboutProject,
  Hero,
  HowItWorks,
  Rules,
  StoreInvitation,
} from "@/components/etiquetas/landing-sections";
import { SolicitacaoForm } from "@/components/etiquetas/solicitacao-form";
import { TrackingCapture } from "@/components/etiquetas/tracking-capture";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Etiquetas com o nome do aluno",
  description: `Peça etiquetas personalizadas para identificar o uniforme escolar da rede municipal de ${SITE.city}. Envio pelos Correios.`,
  alternates: { canonical: "/etiquetas" },
};

export default function EtiquetasPage() {
  return (
    <>
      <Suspense fallback={null}>
        <TrackingCapture />
      </Suspense>
      <SiteTopbar />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <HowItWorks />
        <Rules />
        <SolicitacaoForm />
        <StoreInvitation />
        <AboutProject />
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
