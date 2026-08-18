import { AppShell } from "@/components/app-shell";

export default function ContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
