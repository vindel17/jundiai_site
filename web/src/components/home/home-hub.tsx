import Link from "next/link";
import { getWhatsAppUrl, SITE } from "@/lib/constants";

export function HomeHub() {
  const whatsapp = getWhatsAppUrl("Quero separar o uniforme do meu filho");

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden />
        <div className="home-hero-inner">
          <span className="uj-kicker">{SITE.credenciamento}</span>
          <h1 className="home-title">
            Uniforme escolar <span>em Jundiaí</span>
          </h1>
          <p className="home-lead">
            Conheça a Uniforme Jundiaí e reserve o kit da rede municipal. Escolha
            a escola e os tamanhos das peças, sem pagar agora.
          </p>

          <div className="home-paths">
            <Link href="/reserva" className="home-path home-path-primary">
              <strong>
                Reservar o kit
                <span className="home-tag">Sem pagar agora</span>
                <span className="home-path-arrow" aria-hidden>
                  →
                </span>
              </strong>
              <span>
                A gente separa o kit e avisa quando o voucher abrir. A reserva não
                obriga a compra.
              </span>
            </Link>

            {whatsapp !== "#" ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="home-path">
                <strong>
                  Fazer pelo WhatsApp
                  <span className="home-path-arrow" aria-hidden>
                    →
                  </span>
                </strong>
                <span>A mesma reserva, na conversa, com a escola e os tamanhos.</span>
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
