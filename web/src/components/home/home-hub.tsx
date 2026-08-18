import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ComoFunciona, ComprarBloco, EtiquetasNota } from "./home-sections";

export function HomeHub() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden />
        <div className="home-hero-inner">
          <span className="uj-kicker">Rede municipal de {SITE.city}</span>
          <h1 className="home-title">
            O uniforme que não serve mais <span>serve para alguém hoje</span>
          </h1>
          <p className="home-lead">
            Todo mundo usa o mesmo uniforme na rede. Aqui, quem tem peça parada
            encontra quem precisa dela — direto entre famílias, sem taxa.
          </p>

          <div className="home-paths">
            <Link href="/doacao/doar" className="home-path home-path-primary">
              <strong>
                Quero doar
                <span className="home-tag">Ganhe peça nova</span>
                <span className="home-path-arrow" aria-hidden>
                  →
                </span>
              </strong>
              <span>
                Tire a foto, diga o tamanho e a escola. Duas doações valem uma
                camiseta nova para o seu filho.
              </span>
            </Link>

            <Link href="/doacao/receber" className="home-path">
              <strong>
                Quero receber
                <span className="home-path-arrow" aria-hidden>
                  →
                </span>
              </strong>
              <span>
                Veja o que já está disponível, filtre pela escola e pelo tamanho
                ou avise o que você procura.
              </span>
            </Link>
          </div>
        </div>
      </section>

      <ComoFunciona />
      <ComprarBloco />
      <EtiquetasNota />
    </main>
  );
}
