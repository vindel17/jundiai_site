import Link from "next/link";
import { PROMO_HERO, formatBRL } from "@/data/catalogo";
import { SITE } from "@/lib/constants";

const PASSOS = [
  {
    titulo: "Anuncie em 1 minuto",
    texto: "Foto da peça, tamanho e a escola. Pronto, já aparece para quem procura.",
  },
  {
    titulo: "Aceite e combine a retirada",
    texto: "Seu WhatsApp só aparece para a família que você aceitar.",
  },
  {
    titulo: "Ajude 2 famílias, ganhe 1 peça nova",
    texto: "Duas doações concluídas para famílias diferentes valem uma peça nova nossa.",
  },
];

export function ComoFunciona() {
  return (
    <section className="uj-block" aria-labelledby="como-funciona">
      <h2 className="uj-block-title" id="como-funciona">
        Como funciona
      </h2>
      <ol className="home-steps">
        {PASSOS.map((passo, i) => (
          <li className="home-step" key={passo.titulo}>
            <span className="home-step-num">{i + 1}</span>
            <span className="home-step-text">
              <strong>{passo.titulo}</strong>
              <span>{passo.texto}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="uj-reward">
        <strong>Doou para 2 famílias? A peça nova é por nossa conta.</strong>
        <p>
          Cada doação concluída vale um ponto — mas só uma por família, para o
          benefício alcançar mais gente.
        </p>
        <div className="uj-reward-dots" aria-hidden>
          <i data-on="false" />
          <i data-on="false" />
        </div>
      </div>

      <ul className="uj-checklist">
        <li>
          <span className="uj-check" aria-hidden>
            ✓
          </span>
          <span>
            <b>Sem taxa</b> — a doação é entre famílias, do começo ao fim.
          </span>
        </li>
        <li>
          <span className="uj-check" aria-hidden>
            ✓
          </span>
          <span>
            <b>Seu telefone não aparece</b> no anúncio; só é liberado para a
            família que você aceitar.
          </span>
        </li>
        <li>
          <span className="uj-check" aria-hidden>
            ✓
          </span>
          <span>
            <b>Entrar é rápido</b> — só o seu WhatsApp, sem senha.
          </span>
        </li>
      </ul>
    </section>
  );
}

export function ComprarBloco() {
  return (
    <section className="uj-block" aria-labelledby="comprar">
      <h2 className="uj-block-title" id="comprar">
        Precisa da peça agora?
      </h2>
      <div className="home-buy">
        <div className="home-buy-values">
          <span className="home-buy-old">
            de {formatBRL(PROMO_HERO.priceFromCents)}
          </span>
          <span className="home-buy-new">
            {formatBRL(PROMO_HERO.priceToCents)}
          </span>
        </div>
        <p className="home-buy-note">
          A partir desse valor — {PROMO_HERO.note}. Entrega em {SITE.city}, com
          etiqueta com o nome do aluno inclusa.
        </p>
        <Link href="/comprar" className="btn-primary home-buy-cta">
          Montar meu pedido
        </Link>
      </div>
    </section>
  );
}

export function EtiquetasNota() {
  return (
    <section className="uj-block">
      <p className="uj-note">
        Só quer colocar o nome no uniforme?{" "}
        <Link href="/etiquetas" className="uj-link">
          Peça as etiquetas com o nome do aluno →
        </Link>
      </p>
    </section>
  );
}
