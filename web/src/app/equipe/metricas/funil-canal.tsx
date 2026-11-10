import type { CanalMetrica } from "@/lib/metrica/etapas";
import { FUNIL } from "@/lib/metrica/etapas";
import {
  formatarPorcentagem,
  funilPorOrigem,
  montarFunil,
  type LinhaFunil,
} from "@/lib/metrica/funil";
import { rotuloCanal } from "@/lib/reserva/origem";

export function FunilCanal({
  titulo,
  canal,
  linhas,
}: {
  titulo: string;
  canal: CanalMetrica;
  linhas: LinhaFunil[];
}) {
  const funil = montarFunil(linhas, canal);
  const origens = funilPorOrigem(linhas, canal);
  const comDados = funil.passos.some((passo) => passo.pessoas > 0);

  return (
    <section>
      <h2>{titulo}</h2>
      {!comDados ? <p className="equipe-lead">Ainda sem registros neste período.</p> : null}
      {comDados ? (
        <>
          <div className="equipe-tabela-wrap">
            <table className="equipe-tabela">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Pessoas</th>
                  <th>Do passo anterior</th>
                  <th>Do início</th>
                </tr>
              </thead>
              <tbody>
                {funil.passos.map((passo) => (
                  <tr key={passo.etapa}>
                    <td>{passo.rotulo}</td>
                    <td>{passo.pessoas.toLocaleString("pt-BR")}</td>
                    <td>{formatarPorcentagem(passo.doAnterior)}</td>
                    <td>{formatarPorcentagem(passo.doInicio)}</td>
                  </tr>
                ))}
                {funil.extras.map((extra) => (
                  <tr key={extra.etapa}>
                    <td>{extra.rotulo}</td>
                    <td>{extra.pessoas.toLocaleString("pt-BR")}</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {funil.maiorPerda ? (
            <p className="equipe-lead">
              Maior perda: de “{funil.maiorPerda.de}” para “{funil.maiorPerda.para}”, onde só{" "}
              {formatarPorcentagem(funil.maiorPerda.seguem)} seguem.
            </p>
          ) : null}

          <h3>Por origem</h3>
          <div className="equipe-tabela-wrap">
            <table className="equipe-tabela">
              <thead>
                <tr>
                  <th>Origem</th>
                  {FUNIL[canal].map((passo) => (
                    <th key={passo.etapa}>{passo.rotulo}</th>
                  ))}
                  <th>Conversão</th>
                </tr>
              </thead>
              <tbody>
                {origens.map((linha) => (
                  <tr key={linha.origem}>
                    <td>{rotuloCanal(linha.origem)}</td>
                    {linha.pessoas.map((pessoas, indice) => (
                      <td key={FUNIL[canal][indice].etapa}>{pessoas.toLocaleString("pt-BR")}</td>
                    ))}
                    <td>{formatarPorcentagem(linha.conversao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
