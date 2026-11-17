import { adicionarAoContador } from "@/app/equipe/reservas/contador-acoes";
import {
  lerContadorEquipe,
  listarLancamentos,
  type LancamentoContador,
} from "@/lib/reserva/contador-consulta";

function quando(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function sinal(quantidade: number) {
  const texto = quantidade.toLocaleString("pt-BR");
  return quantidade > 0 ? `+${texto}` : texto;
}

export async function ContadorAdmin({ resultado }: { resultado?: string }) {
  const [contador, lancamentos] = await Promise.all([
    lerContadorEquipe().catch(() => null),
    listarLancamentos().catch(() => [] as LancamentoContador[]),
  ]);

  return (
    <section className="equipe-contador">
      <h2>Contador do site</h2>
      <p className="equipe-lead">
        O site soma todas as reservas, inclusive as canceladas, com o que você adicionar aqui. Este
        campo só altera esse contador. A lista de reservas continua igual.
      </p>
      {contador ? (
        <p className="equipe-lead">
          No sistema: <b>{contador.sistema.toLocaleString("pt-BR")}</b>. Por fora:{" "}
          <b>{contador.fora.toLocaleString("pt-BR")}</b>. No site:{" "}
          <b>{contador.total.toLocaleString("pt-BR")}</b>.
        </p>
      ) : (
        <p className="equipe-aviso">Não consegui ler o contador agora.</p>
      )}
      {resultado === "ok" ? <p className="equipe-lead">Número adicionado ao contador.</p> : null}
      {resultado === "invalido" ? (
        <p className="equipe-aviso">Informe um número inteiro diferente de zero, até 10 mil.</p>
      ) : null}
      {resultado === "falha" ? (
        <p className="equipe-aviso">
          Não consegui gravar. Aplique a migração 0019 no banco e tente de novo.
        </p>
      ) : null}

      <form action={adicionarAoContador}>
        <label>
          Quantidade a somar
          <input
            name="quantidade"
            type="number"
            inputMode="numeric"
            min={-10000}
            max={10000}
            step={1}
            required
          />
        </label>
        <label className="equipe-contador-nota">
          De onde veio
          <input name="nota" type="text" maxLength={200} placeholder="Feira da escola, caderno" />
        </label>
        <button className="btn-primary" type="submit">
          Adicionar ao contador
        </button>
      </form>
      <p className="equipe-lead">Um número negativo desfaz um lançamento, sem apagar o histórico.</p>
      {lancamentos.length > 0 ? (
        <ul className="equipe-lista">
          {lancamentos.map((item) => (
            <li key={item.id}>
              {sinal(item.quantidade)}
              {item.nota ? ` — ${item.nota}` : ""}
              {" · "}
              {item.autor}
              {" · "}
              {quando(item.criadoEm)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
