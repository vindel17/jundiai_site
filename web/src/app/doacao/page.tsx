import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Doações",
  description: `Doe ou receba uniforme escolar da rede municipal de ${SITE.city}.`,
};

export default function DoacoesPage() {
  return (
    <main className="uj-page">
      <span className="uj-kicker">Rede municipal de {SITE.city}</span>
      <h1 className="uj-page-title">Doações</h1>
      <p className="uj-page-lead">
        Quem tem uma peça parada encontra quem precisa dela. A doação continua
        entre famílias, sem taxa.
      </p>

      <div className="home-paths" style={{ marginTop: "1.2rem" }}>
        <Link href="/doacao/doar" className="home-path home-path-primary">
          <strong>
            Quero doar
            <span className="home-path-arrow" aria-hidden>
              →
            </span>
          </strong>
          <span>Tire a foto, diga o tamanho e a escola.</span>
        </Link>
        <Link href="/doacao/receber" className="home-path">
          <strong>
            Quero receber
            <span className="home-path-arrow" aria-hidden>
              →
            </span>
          </strong>
          <span>Veja o que já está disponível ou avise o que você procura.</span>
        </Link>
      </div>
    </main>
  );
}
