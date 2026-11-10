import type { Metadata } from "next";
import Link from "next/link";
import { acessoMetricas } from "@/app/equipe/acesso";
import { FunilCanal } from "@/app/equipe/metricas/funil-canal";
import { NavAdmin, NegadoAdmin } from "@/app/equipe/nav-admin";
import { PERIODOS, lerFunil, lerPeriodo } from "@/lib/metrica/consulta";
import { adminConfigurado } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Métricas",
};

export const dynamic = "force-dynamic";

async function carregar(periodo: ReturnType<typeof lerPeriodo>) {
  if (!adminConfigurado()) return { erro: "Falta a chave do banco para a equipe ler as métricas." };
  try {
    return { linhas: await lerFunil(periodo) };
  } catch {
    return { erro: "Não consegui ler o funil. Aplique a migração 0012 no banco." };
  }
}

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const acesso = await acessoMetricas("/equipe/metricas");
  if (!acesso.ok) return <NegadoAdmin titulo="Métricas" aviso={acesso.aviso} />;

  const periodo = lerPeriodo((await searchParams).periodo);
  const { linhas, erro } = await carregar(periodo);

  return (
    <main id="conteudo" tabIndex={-1}>
      <span className="uj-kicker">Uniforme Jundiaí</span>
      <h1>Métricas</h1>
      <p className="equipe-lead">
        Quantas pessoas chegam a cada etapa, do primeiro contato à reserva confirmada. Cada pessoa
        conta uma vez por etapa. A medição começou quando esta tela entrou no ar: não há histórico
        anterior.
      </p>
      <NavAdmin atual="/equipe/metricas" />
      <p className="equipe-paginacao" aria-label="Período">
        {PERIODOS.map((item) =>
          item.valor === periodo ? (
            <b key={item.valor}>{item.rotulo}</b>
          ) : (
            <Link key={item.valor} href={`/equipe/metricas?periodo=${item.valor}`}>
              {item.rotulo}
            </Link>
          ),
        )}
      </p>

      {erro ? <p className="equipe-aviso">{erro}</p> : null}
      {linhas ? (
        <>
          <FunilCanal titulo="WhatsApp" canal="whatsapp" linhas={linhas} />
          <FunilCanal titulo="Site" canal="site" linhas={linhas} />
          <p className="equipe-lead">
            Quem chega pelo site e continua no WhatsApp conta nos dois funis. O WhatsApp só sabe a
            origem (panfleto, anúncio, indicação) quando a primeira mensagem traz o convite “Vim
            pelo…”.
          </p>
        </>
      ) : null}
    </main>
  );
}
