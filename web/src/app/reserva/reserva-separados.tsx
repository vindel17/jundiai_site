import { textoPremioIndicacao } from "@/lib/indicacao/regras";
import { rotuloEntrega } from "@/lib/reserva/entrega";
import { kitCompleto, pecasDoKit, rotuloKit, rotuloTamanho } from "@/lib/reserva/kit";
import type { listarReservasDoTelefone } from "@/lib/reserva/consultas";

type Linhas = Awaited<ReturnType<typeof listarReservasDoTelefone>>["linhas"];

/** Kits que a família já separou, no site ou pelo WhatsApp, e o link de indicação. */
export function KitsSeparados({ linhas, link }: { linhas: Linhas; link: string }) {
  if (linhas.length === 0) return null;

  return (
    <section className="reserva-bloco reserva-separados">
      <h2 className="reserva-titulo-bloco">Kits já separados</h2>
      <ul className="reserva-kits">
        {linhas.map((linha) => (
          <li key={linha.id} className="reserva-kit">
            <b>
              {linha.aluno} · {rotuloKit(linha.kit)}
            </b>
            <p className="reserva-kit-escola">{linha.escola}</p>
            <dl>
              {pecasDoKit(linha.kit).map((peca) => (
                <div key={peca.chave}>
                  <dt>{peca.nome}</dt>
                  <dd>{rotuloTamanho(linha.tamanhos[peca.chave])}</dd>
                </div>
              ))}
              {linha.entrega ? (
                <div>
                  <dt>Como receber</dt>
                  <dd>{rotuloEntrega(linha.entrega, kitCompleto(linha.tamanhos))}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
      {link ? (
        <p className="reserva-link">
          Indique outras famílias com o seu link. {textoPremioIndicacao()}
          <a href={link}>{link}</a>
        </p>
      ) : null}
    </section>
  );
}
