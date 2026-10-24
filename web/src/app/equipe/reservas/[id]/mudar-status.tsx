import { mudarStatusReservas } from "@/app/equipe/reservas/acoes";
import { type PerfilEquipe } from "@/lib/reserva/equipe";
import { podeTransitar } from "@/lib/reserva/gestao";
import { proximosStatus, rotuloStatus, type StatusReserva } from "@/lib/reserva/status";

export function MudarStatus({
  id,
  status,
  perfis,
}: {
  id: string;
  status: StatusReserva;
  perfis: PerfilEquipe[];
}) {
  const destinos = proximosStatus(status).filter((para) => podeTransitar(perfis, status, para));
  if (destinos.length === 0) return null;

  return (
    <section>
      <h2>Status</h2>
      <form className="equipe-filtros" action={mudarStatusReservas}>
        <input type="hidden" name="ids" value={id} />
        <input type="hidden" name="volta" value={`/equipe/reservas/${id}`} />
        <label>
          Mudar para
          <select name="para" defaultValue={destinos[0]}>
            {destinos.map((para) => (
              <option key={para} value={para}>
                {rotuloStatus(para)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Observação
          <input name="observacao" maxLength={500} placeholder="Opcional" />
        </label>
        <button className="btn-primary" type="submit">
          Mudar status
        </button>
      </form>
    </section>
  );
}
