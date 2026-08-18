import { AppShell } from "@/components/app-shell";

export default function PedidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
