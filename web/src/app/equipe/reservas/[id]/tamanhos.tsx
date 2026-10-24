import { salvarReserva } from "@/app/equipe/reservas/acoes";
import { type ReservaLinha } from "@/lib/reserva/consultas";
import { rotuloEntrega } from "@/lib/reserva/entrega";
import { SEM_PECA, TAMANHOS_KIT, kitCompleto, pecasDoKit, rotuloTamanho } from "@/lib/reserva/kit";

export function Tamanhos({ reserva, aberta }: { reserva: ReservaLinha; aberta: boolean }) {
  const pecas = pecasDoKit(reserva.kit);

  if (!aberta) {
    return (
      <ul className="equipe-lista">
        {pecas.map((peca) => (
          <li key={peca.chave}>
            {peca.nome}: {rotuloTamanho(reserva.tamanhos[peca.chave])}
          </li>
        ))}
        <li>
          Como receber:{" "}
          {reserva.entrega
            ? rotuloEntrega(reserva.entrega, kitCompleto(reserva.tamanhos))
            : "não informado"}
        </li>
      </ul>
    );
  }

  return (
    <form className="equipe-tamanhos" action={salvarReserva}>
      <input type="hidden" name="id" value={reserva.id} />
      {pecas.map((peca) => (
        <label key={peca.chave}>
          {peca.nome}
          {peca.quantidade > 1 ? " (as duas peças)" : ""}
          <select name={peca.chave} defaultValue={reserva.tamanhos[peca.chave] ?? SEM_PECA}>
            {TAMANHOS_KIT.map((tamanho) => (
              <option key={tamanho} value={tamanho}>
                {tamanho}
              </option>
            ))}
            <option value={SEM_PECA}>Sem esta peça</option>
          </select>
        </label>
      ))}
      <label>
        Como receber
        <select name="entrega" defaultValue={reserva.entrega ?? ""} required>
          <option value="" disabled>
            Não informado
          </option>
          <option value="casa">Receber em casa</option>
          <option value="loja">Retirar na loja</option>
        </select>
      </label>
      <button className="btn-primary" type="submit">
        Salvar reserva
      </button>
    </form>
  );
}
