import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { HomeHub } from "@/components/home/home-hub";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: SITE.name,
  description: `Doe, receba ou compre uniforme escolar da rede municipal de ${SITE.city}. Entre famílias, sem taxa.`,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <AppShell>
      <HomeHub />
    </AppShell>
  );
}
