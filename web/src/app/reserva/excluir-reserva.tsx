"use client";

import { useActionState } from "react";
import { excluirReserva, type EstadoExclusao } from "@/app/reserva/acoes";

const INICIAL: EstadoExclusao = {};

export function ExcluirReserva({ id, aluno }: { id: string; aluno: string }) {
  const [estado, acao, pendente] = useActionState(excluirReserva, INICIAL);

  return (
    <form action={acao} className="reserva-excluir-form">
      <input type="hidden" name="id" value={id} />
      {estado.erro ? <p className="entrar-erro">{estado.erro}</p> : null}
      <button
        type="submit"
        className="reserva-excluir"
        disabled={pendente}
        onClick={(evento) => {
          if (pendente) return;
          const certeza = window.confirm(
            `Excluir a reserva de ${aluno}? Ela sai da sua conta.`,
          );
          if (!certeza) evento.preventDefault();
        }}
      >
        {pendente ? "Excluindo..." : "Excluir reserva"}
      </button>
    </form>
  );
}
