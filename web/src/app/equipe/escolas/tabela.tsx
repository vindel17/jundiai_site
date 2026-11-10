import Link from "next/link";
import {
  formatarPercentual,
  type LinhaCobertura,
  type OrdemCobertura,
} from "@/lib/reserva/cobertura";

const COLUNAS: { ordem: OrdemCobertura; rotulo: string }[] = [
  { ordem: "nome", rotulo: "Escola" },
  { ordem: "alunos", rotulo: "Alunos" },
  { ordem: "reservas", rotulo: "Reservas" },
  { ordem: "percentual", rotulo: "Alcance" },
];

export function TabelaCobertura({
  linhas,
  ordem,
}: {
  linhas: LinhaCobertura[];
  ordem: OrdemCobertura;
}) {
  return (
    <div className="equipe-tabela-wrap">
      <table className="equipe-tabela">
        <thead>
          <tr>
            {COLUNAS.map((coluna) => (
              <th key={coluna.ordem} aria-sort={coluna.ordem === ordem ? "descending" : undefined}>
                <Link href={`/equipe/escolas?ordem=${coluna.ordem}`}>{coluna.rotulo}</Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.escola}>
              <td>
                {linha.escola}
                <div>{linha.bairro}</div>
              </td>
              <td>{linha.alunos.toLocaleString("pt-BR")}</td>
              <td>{linha.reservas.toLocaleString("pt-BR")}</td>
              <td>
                {formatarPercentual(linha.percentual)}
                <div className="equipe-barra" aria-hidden>
                  <span style={{ width: `${Math.min(100, linha.percentual)}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
