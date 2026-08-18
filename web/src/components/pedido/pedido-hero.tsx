"use client";

import Link from "next/link";
import { PROMO_HERO, formatBRL } from "@/data/catalogo";
import { SITE } from "@/lib/constants";

export function PedidoHero() {
  return (
    <section className="uj-hero" aria-labelledby="uj-hero-title">
      <div className="uj-hero-bg" aria-hidden />
      <div className="uj-hero-inner">
        <span className="gift-badge">🎒 {PROMO_HERO.yearLabel}</span>
        <h1 className="uj-hero-title" id="uj-hero-title">
          Uniforme escolar com <span>preço de inauguração</span>
        </h1>
        <p className="uj-hero-lead">
          Escolha as peças, o tamanho e receba em casa. Tudo pelo celular, em
          poucos minutos.
        </p>

        <div className="uj-price-card">
          <div className="uj-price-values">
            <span className="uj-price-old">
              de {formatBRL(PROMO_HERO.priceFromCents)}
            </span>
            <span className="uj-price-new">
              {formatBRL(PROMO_HERO.priceToCents)}
            </span>
          </div>
          <p className="uj-price-note">
            A partir desse valor — {PROMO_HERO.note}
          </p>
        </div>

        <a href="#passo-1" className="btn-primary btn-gift uj-hero-cta">
          Começar meu pedido
        </a>
        <p className="uj-price-note" style={{ marginTop: "0.75rem" }}>
          Entrega em {SITE.city}. Pagamento na confirmação, pelo WhatsApp.
        </p>
        <p className="uj-price-note" style={{ marginTop: "0.5rem" }}>
          Tem uniforme parado?{" "}
          <Link href="/" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Doe ou receba aqui
          </Link>
        </p>
      </div>
    </section>
  );
}
