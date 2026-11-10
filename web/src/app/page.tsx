import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { HomeHub } from "@/components/home/home-hub";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: SITE.name,
  description: `Reserve o uniforme escolar de ${SITE.city} no tamanho certo, sem pagar agora. ${SITE.credenciamento}.`,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <AppShell>
      <HomeHub />
    </AppShell>
  );
}
