import type { Metadata } from "next";
import "./equipe.css";

export const metadata: Metadata = {
  title: "Equipe",
  robots: { index: false, follow: false },
};

export default function EquipeLayout({ children }: { children: React.ReactNode }) {
  return <div className="equipe-shell">{children}</div>;
}
