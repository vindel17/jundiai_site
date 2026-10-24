function textoMudanca(mudou: number, pulou: number) {
  const ok = mudou === 1 ? "1 reserva atualizada." : `${mudou} reservas atualizadas.`;
  if (!Number.isInteger(pulou) || pulou <= 0) return ok;
  const nao = pulou === 1 ? "1 não mudou." : `${pulou} não mudaram.`;
  return `${ok} ${nao}`;
}

export function Avisos({
  aviso,
}: {
  aviso: { salvo?: string; erro?: string; mudou?: string; pulou?: string };
}) {
  const mudou = Number(aviso.mudou);
  const pulou = Number(aviso.pulou);

  return (
    <>
      {aviso.salvo ? <p className="equipe-lead">Reserva salva.</p> : null}
      {Number.isInteger(mudou) && mudou > 0 ? (
        <p className="equipe-lead">{textoMudanca(mudou, pulou)}</p>
      ) : null}
      {aviso.erro === "prazo" ? (
        <p className="equipe-aviso">O prazo para mudar a reserva terminou em 31 de dezembro.</p>
      ) : null}
      {aviso.erro === "travada" ? (
        <p className="equipe-aviso">A reserva já entrou em produção. O tamanho não muda mais.</p>
      ) : null}
      {aviso.erro === "falha" ? (
        <p className="equipe-aviso">Não consegui salvar agora. Tente de novo.</p>
      ) : null}
      {aviso.erro === "tamanho" ? (
        <p className="equipe-aviso">
          Deixe ao menos uma peça com tamanho e escolha como a família vai receber.
        </p>
      ) : null}
      {aviso.erro === "status" ? (
        <p className="equipe-aviso">
          Marque ao menos uma reserva e um status que ela possa receber.
        </p>
      ) : null}
    </>
  );
}
