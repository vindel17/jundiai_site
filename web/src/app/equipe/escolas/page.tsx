import type { Metadata } from "next";
import { acessoMetricas } from "@/app/equipe/acesso";
import { NavAdmin, NegadoAdmin } from "@/app/equipe/nav-admin";
import { TabelaCobertura } from "@/app/equipe/escolas/tabela";
import {
  calcularCobertura,
  formatarPercentual,
  lerOrdemCobertura,
} from "@/lib/reserva/cobertura";
import { contarReservasPorEscola } from "@/lib/reserva/cobertura-consulta";
import { adminConfigurado } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Alcance por escola",
};

export const dynamic = "force-dynamic";

async function carregar(ordem: ReturnType<typeof lerOrdemCobertura>) {
  if (!adminConfigurado()) return { erro: "Falta a chave do banco para a equipe ler as reservas." };
  try {
    return { cobertura: calcularCobertura(await contarReservasPorEscola(), ordem) };
  } catch {
    return { erro: "Não consegui ler as reservas. Confira se a migração das reservas está aplicada." };
  }
}

export default async function EscolasPage({
  searchParams,
}: {
  searchParams: Promise<{ ordem?: string }>;
}) {
  const acesso = await acessoMetricas("/equipe/escolas");
  if (!acesso.ok) return <NegadoAdmin titulo="Alcance por escola" aviso={acesso.aviso} />;

  const ordem = lerOrdemCobertura((await searchParams).ordem);
  const { cobertura, erro } = await carregar(ordem);

  return (
    <main id="conteudo" tabIndex={-1}>
      <span className="uj-kicker">Uniforme Jundiaí</span>
      <h1>Alcance por escola</h1>
      <p className="equipe-lead">
        Reservas ativas (sem as canceladas) divididas pelos alunos de cada escola na lista do
        voucher. Cada reserva é um aluno. Pedidos entram aqui quando a compra for registrada.
      </p>
      <NavAdmin atual="/equipe/escolas" />

      {erro ? <p className="equipe-aviso">{erro}</p> : null}
      {cobertura ? (
        <>
          <ul className="equipe-lista">
            <li>
              <b>{cobertura.totalReservas.toLocaleString("pt-BR")}</b> reservas em{" "}
              {cobertura.totalAlunos.toLocaleString("pt-BR")} alunos:{" "}
              <b>{formatarPercentual(cobertura.percentualGeral)}</b> da rede.
            </li>
            <li>
              {cobertura.escolasSemReserva} de {cobertura.escolas.length} escolas ainda sem
              nenhuma reserva.
            </li>
            {cobertura.foraDaLista > 0 ? (
              <li>
                {cobertura.foraDaLista} reservas de escolas fora da lista do voucher (cadastro
                antigo), não contadas acima.
              </li>
            ) : null}
          </ul>
          <TabelaCobertura linhas={cobertura.escolas} ordem={ordem} />
        </>
      ) : null}
    </main>
  );
}
