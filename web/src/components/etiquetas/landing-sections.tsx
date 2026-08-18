import { SITE } from "@/lib/constants";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden />
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="gift-badge">🏷️ Uniforme com nome não se perde</span>
          <h1 className="hero-title">
            Etiquetas com o nome do <span>seu filho</span>
          </h1>
          <p className="hero-lead">
            Peça um kit de etiquetas personalizadas para identificar cada peça do
            uniforme. Você escolhe o nome ou as iniciais, aplica com o ferro de
            passar e acabou a peça perdida na escola.
          </p>
          <div className="hero-actions">
            <a href="#formulario" className="btn-primary btn-gift">
              Pedir minhas etiquetas
            </a>
            <Link href="/comprar" className="btn-secondary btn-gift">
              Ver uniformes
            </Link>
          </div>
          <p className="gift-proof hero-proof">
            <strong>
              Até {SITE.etiquetasPorFilho * SITE.maxFilhos} etiquetas por família
            </strong>
            <span>para até {SITE.maxFilhos} filhos</span>
          </p>
          <p className="hero-meta">
            Para famílias da rede municipal de {SITE.city} · entrega pelos
            Correios
          </p>
        </div>

        <div className="gift-visual" aria-label="Exemplo de etiquetas personalizadas">
          <span className="gift-spark gift-spark-one">✦</span>
          <span className="gift-spark gift-spark-two">✦</span>
          <div className="gift-envelope">
            <span className="gift-envelope-flap" aria-hidden />
            <div className="label-sheet">
              <p className="label-sheet-title">Feito especialmente para</p>
              {["MARIA S.", "MARIA S.", "MARIA S.", "MARIA S.", "MARIA S."].map(
                (name, index) => (
                  <span key={index} className="sample-label">
                    <span className="sample-icon">♥</span>
                    {name}
                  </span>
                ),
              )}
            </div>
          </div>
          <span className="gift-note">
            {SITE.etiquetasPorFilho} etiquetas por filho 💙
          </span>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: "✍️",
      title: "Conte para a gente",
      text: "Preencha os dados e escolha como o nome vai aparecer.",
    },
    {
      icon: "✨",
      title: "Nós personalizamos",
      text: `Preparamos ${SITE.etiquetasPorFilho} etiquetas para cada filho, com todo carinho.`,
    },
    {
      icon: "📬",
      title: "Chega na sua casa",
      text: "Você recebe pelo correio e acompanha tudo pelo WhatsApp.",
    },
  ];

  return (
    <section className="section-block section-alt">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <p className="eyebrow">Simples assim</p>
          <h2 className="section-title">Como funciona</h2>
          <p className="section-lead mx-auto">
            Você leva só alguns minutos para pedir.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="how-step">
              <span className="how-step-num">{index + 1}</span>
              <span className="how-step-icon" aria-hidden>{step.icon}</span>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="mt-2 text-[var(--muted)]">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Rules() {
  const items = [
    {
      icon: "👕",
      title: "Adeus, uniforme perdido",
      text: "O nome fica visível na parte interna da peça.",
    },
    {
      icon: "🔥",
      title: "Fácil de aplicar",
      text: "Você só precisa de um ferro de passar roupas.",
    },
    {
      icon: "💌",
      title: "Feita para seu filho",
      text: "Escolha o nome ou as iniciais que vão na etiqueta.",
    },
    {
      icon: "🏠",
      title: "Chega até você",
      text: `Enviamos para o seu endereço em ${SITE.city}.`,
    },
  ];

  return (
    <section className="section-block">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <p className="eyebrow">Pequena etiqueta, grande ajuda</p>
          <h2 className="section-title">Mais tranquilidade na rotina escolar</h2>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.title} className="benefit-card">
              <span className="benefit-icon" aria-hidden>{item.icon}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="gift-cta">
          <div>
            <strong>Quantas etiquetas vêm no kit 💙</strong>
            <p>
              {SITE.etiquetasPorFilho} etiquetas por filho, para até{" "}
              {SITE.maxFilhos} filhos por família.
            </p>
          </div>
          <a href="#formulario" className="btn-primary btn-gift gift-cta-btn">
            Pedir minhas etiquetas
          </a>
        </div>
      </div>
    </section>
  );
}

export function AboutProject() {
  return (
    <section className="section-block section-alt">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="about-copy">
          <p className="eyebrow">Estamos chegando</p>
          <h2 className="section-title">
            Uma nova loja de uniformes em {SITE.city}
          </h2>
          <p className="section-lead">
            O {SITE.name} é o novo jeito de resolver o uniforme escolar da rede
            municipal: pedido online, atendimento pelo WhatsApp, entrega perto de
            você e uma rede de doação entre famílias. Toda peça comprada aqui já
            vai com a etiqueta com o nome do aluno.
          </p>
          <p className="about-credit">
            Uma iniciativa da <strong>Espaço Livre Uniformes</strong>, criada com
            carinho para as famílias de {SITE.city}.
          </p>
        </div>
      </div>
    </section>
  );
}

export function StoreInvitation() {
  const categories = [
    { icon: "👕", title: "Camisetas", text: "Conforto para todos os dias." },
    { icon: "🩳", title: "Bermudas e calças", text: "Peças para cada estação." },
    { icon: "🧥", title: "Agasalhos", text: "Proteção para os dias mais frios." },
  ];

  return (
    <section className="section-block store-invitation">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="store-invitation-head">
          <div>
            <p className="eyebrow">Uniforme completo</p>
            <h2 className="section-title">Conheça a nossa nova loja</h2>
            <p className="section-lead">
              Estamos preparando uma experiência simples para você encontrar os
              uniformes escolares de {SITE.city} sem sair de casa.
            </p>
          </div>
          <Link href="/comprar" className="btn-secondary store-invitation-btn">
            Ver uniformes
          </Link>
        </div>

        <ul className="store-category-grid">
          {categories.map((category) => (
            <li key={category.title} className="store-category-card">
              <span aria-hidden>{category.icon}</span>
              <div>
                <h3>{category.title}</h3>
                <p>{category.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
