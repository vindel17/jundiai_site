import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  // Repete o template do layout raiz: título de string simples aqui apagaria
  // o sufixo do site nas páginas filhas.
  title: {
    default: `Doação de uniformes | ${SITE.name}`,
    template: `%s | ${SITE.name}`,
  },
  description: `Doe ou receba uniforme escolar da rede municipal de ${SITE.city}. Anúncio com foto, filtros por escola e tamanho.`,
};

export default function DoacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
