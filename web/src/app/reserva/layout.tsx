import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Reserva Voucher",
  description: `Separe o uniforme escolar de ${SITE.city} no tamanho certo, sem pagar agora.`,
};

export default function ReservaLayout({ children }: { children: React.ReactNode }) {
  return <AppShell largo>{children}</AppShell>;
}
