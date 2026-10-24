import type { Metadata } from "next";
import { acessoEquipe } from "@/app/equipe/acesso";
import { Avisos } from "@/app/equipe/reservas/avisos";
import { lerFiltro } from "@/app/equipe/reservas/filtros";
import { Lista } from "@/app/equipe/reservas/lista";
import { rotuloPerfis } from "@/lib/reserva/equipe";

export const metadata: Metadata = {
  title: "Reservas",
};

export const dynamic = "force-dynamic";

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    escola?: string;
    canal?: string;
    status?: string;
    kit?: string;
    entrega?: string;
    pagina?: string;
    erro?: string;
    mudou?: string;
    pulou?: string;
  }>;
}) {
  const acesso = await acessoEquipe("/equipe/reservas");
  const bruto = await searchParams;
  const filtro = lerFiltro(bruto);

  return (
    <main id="conteudo" tabIndex={-1}>
      <span className="uj-kicker">Uniforme Jundiaí</span>
      <h1>Reservas</h1>
      <p className="equipe-lead">
        Cada linha é um aluno. A origem pode ser panfleto, rede social, tráfego pago, indicação ou
        a conversa direta. O tamanho muda até a reserva entrar em produção, ou até 31 de dezembro.
      </p>

      {acesso.tipo === "sem-lista" ? (
        <p className="equipe-aviso">
          Defina a equipe no ambiente. EQUIPE_TELEFONES e EQUIPE_EMAILS entram como administração.
        </p>
      ) : null}
      {acesso.tipo === "fora" ? <p className="equipe-aviso">Esta conta não está na equipe.</p> : null}

      {acesso.tipo === "ok" ? (
        <>
          <p className="equipe-lead">Seu acesso: {rotuloPerfis(acesso.perfis)}.</p>
          <Avisos aviso={bruto} />
          <Lista filtro={filtro} perfis={acesso.perfis} />
        </>
      ) : null}
    </main>
  );
}
