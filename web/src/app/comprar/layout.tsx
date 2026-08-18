import { AppShell } from "@/components/app-shell";

export default function ComprarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell comBarraFixa>{children}</AppShell>;
}
