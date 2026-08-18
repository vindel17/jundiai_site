import Link from "next/link";
import { qsReceber, type FiltroReceber } from "@/lib/doacao/modelos";

export function FeedBorrado({
  total,
  filtro,
}: {
  total: number;
  filtro: FiltroReceber;
}) {
  const proximo = qsReceber(filtro, {});
  const cards = Math.min(Math.max(total, 3), 6);

  return (
    <div className="doacao-vitrine">
      <ul className="doacao-list" aria-hidden>
        {Array.from({ length: cards }, (_, i) => (
          <li key={i} className="doacao-card" data-borrado="true">
            <div className="doacao-card-photo">Foto</div>
            <div className="doacao-card-body">
              <div className="doacao-card-top">
                <strong>Camiseta disponível</strong>
                <span className="doacao-size">Tam. ·</span>
              </div>
              <p className="doacao-card-meta">
                1 peça · estado bom
                <span className="doacao-card-school">EMEB de Jundiaí</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="doacao-vitrine-cta">
        <p>
          <b>
            {total === 1 ? "1 peça no ar" : `${total} peças no ar`}
            {filtro.tamanho ? ` no tamanho ${filtro.tamanho}` : ""}
          </b>
          Entre com o WhatsApp para ver qual é e chamar a família.
        </p>
        <Link
          href={`/entrar?proximo=${encodeURIComponent(proximo)}`}
          className="btn-primary"
        >
          Entrar para ver as peças
        </Link>
      </div>
    </div>
  );
}
