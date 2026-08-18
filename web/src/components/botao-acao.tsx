"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  /** Texto durante o envio, ex.: "Enviando..." */
  pendenteLabel: string;
  className?: string;
  /** Preencha nos formulários com mais de um botão (ex.: aceitar/recusar). */
  name?: string;
  value?: string;
};

/** Botão de envio que mostra progresso da server action do formulário pai. */
export function BotaoAcao({
  children,
  pendenteLabel,
  className = "btn-primary",
  name,
  value,
}: Props) {
  const { pending, data } = useFormStatus();
  // Com dois botões no mesmo formulário, só o acionado mostra o progresso.
  const acionado = !name || !data || data.get(name) === value;
  const carregando = pending && acionado;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      disabled={pending}
      aria-busy={carregando}
    >
      {carregando ? pendenteLabel : children}
    </button>
  );
}
