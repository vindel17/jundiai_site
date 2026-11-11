import Link from "next/link";

const TELAS = [
  { href: "/equipe/reservas", rotulo: "Reservas" },
  { href: "/equipe/atendimento", rotulo: "Atendimento" },
  { href: "/equipe/escolas", rotulo: "Alcance por escola" },
  { href: "/equipe/metricas", rotulo: "Métricas" },
] as const;

export function NavAdmin({ atual }: { atual: (typeof TELAS)[number]["href"] }) {
  return (
    <nav className="equipe-paginacao" aria-label="Telas da equipe">
      {TELAS.map((tela) =>
        tela.href === atual ? (
          <b key={tela.href} aria-current="page">
            {tela.rotulo}
          </b>
        ) : (
          <Link key={tela.href} href={tela.href}>
            {tela.rotulo}
          </Link>
        ),
      )}
    </nav>
  );
}

export function NegadoAdmin({ titulo, aviso }: { titulo: string; aviso: string }) {
  return (
    <main id="conteudo" tabIndex={-1}>
      <h1>{titulo}</h1>
      <p className="equipe-aviso">{aviso}</p>
      <Link href="/equipe/reservas">Voltar às reservas</Link>
    </main>
  );
}
