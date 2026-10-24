import { DATA_EQUIPE } from "@/app/equipe/data";
import { listarEventos } from "@/lib/reserva/mudanca";
import { rotuloStatus } from "@/lib/reserva/status";

export async function Historico({ id }: { id: string }) {
  const eventos = await listarEventos(id).catch(() => null);

  return (
    <section>
      <h2>Histórico</h2>
      {eventos === null ? (
        <p className="equipe-aviso">O histórico ainda não está no banco.</p>
      ) : eventos.length === 0 ? (
        <p className="equipe-lead">Ainda não há mudança de status.</p>
      ) : (
        <ol className="equipe-lista">
          {eventos.map((evento) => (
            <li key={evento.id}>
              {DATA_EQUIPE.format(new Date(evento.criadoEm))}
              {" · "}
              {evento.statusDe ? rotuloStatus(evento.statusDe) : "Início"} para{" "}
              {rotuloStatus(evento.statusPara)}
              {" · "}
              {evento.autor}
              {evento.observacao ? ` · ${evento.observacao}` : ""}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
