import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acessoEquipe } from "@/app/equipe/acesso";
import { Avisos } from "@/app/equipe/reservas/avisos";
import { Familia } from "@/app/equipe/reservas/[id]/familia";
import { Historico } from "@/app/equipe/reservas/[id]/historico";
import { MudarStatus } from "@/app/equipe/reservas/[id]/mudar-status";
import { Tamanhos } from "@/app/equipe/reservas/[id]/tamanhos";
import { obterReserva } from "@/lib/reserva/consultas";
import { pode } from "@/lib/reserva/equipe";
import { rotuloKit } from "@/lib/reserva/kit";
import { rotuloCanal } from "@/lib/reserva/origem";
import { reservaEditavel, rotuloStatus } from "@/lib/reserva/status";
import { adminConfigurado } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Reserva" };
export const dynamic = "force-dynamic";

export default async function ReservaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; erro?: string; mudou?: string; pulou?: string }>;
}) {
  const { id } = await params;
  const aviso = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const acesso = await acessoEquipe(`/equipe/reservas/${id}`);
  if (acesso.tipo !== "ok" || !adminConfigurado()) {
    return (
      <main id="conteudo" tabIndex={-1}>
        <p className="equipe-aviso">Esta ficha não está disponível para esta conta.</p>
        <Link href="/equipe/reservas">Voltar</Link>
      </main>
    );
  }

  const reserva = await obterReserva(id).catch(() => null);
  if (!reserva) notFound();
  const editavel = reservaEditavel(reserva.status);
  const aberta = editavel && pode(acesso.perfis, "editar");

  return (
    <main id="conteudo" tabIndex={-1}>
      <Link href="/equipe/reservas">Reservas</Link>
      <h1>{reserva.aluno}</h1>
      <p className="equipe-lead">
        {reserva.escola}. Kit {rotuloKit(reserva.kit).toLowerCase()}. Origem:{" "}
        {rotuloCanal(reserva.origemCanal)}
        {reserva.origemCodigo ? ` · ${reserva.origemCodigo}` : ""}. Status:{" "}
        {rotuloStatus(reserva.status).toLowerCase()}.
      </p>

      <Avisos aviso={aviso} />
      {editavel && !aberta ? <p className="equipe-lead">Seu acesso consulta esta reserva.</p> : null}

      <Tamanhos reserva={reserva} aberta={aberta} />
      <MudarStatus id={reserva.id} status={reserva.status} perfis={acesso.perfis} />
      <Familia telefone={reserva.telefone} atual={reserva.id} />
      <Historico id={reserva.id} />
    </main>
  );
}
