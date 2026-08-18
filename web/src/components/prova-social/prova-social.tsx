import Link from "next/link";
import { nomeModelo } from "@/lib/avaliacoes";
import type { AvaliacaoPublica, ResumoAvaliacao } from "@/types/avaliacao";
import { Estrelas } from "./estrelas";

type Props = {
  avaliacoes: AvaliacaoPublica[];
  resumos: ResumoAvaliacao[];
  media: number;
  total: number;
};

function formatarData(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ProvaSocial({ avaliacoes, resumos, media, total }: Props) {
  return (
    <section className="uj-section ps-bloco" id="prova-social" aria-labelledby="prova-social-titulo">
      <div className="uj-step-head">
        <span className="uj-step-num" aria-hidden>
          ★
        </span>
        <h2 id="prova-social-titulo">Quem já comprou</h2>
      </div>

      {total > 0 ? (
        <div className="ps-resumo">
          <Estrelas nota={Math.round(media)} tamanho="lg" />
          <p>
            <strong>{media.toFixed(1)}</strong> de 5 · {total}{" "}
            {total === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
      ) : (
        <p className="uj-step-hint">
          Seja a primeira família a contar como ficou o uniforme. Ajuda quem
          ainda está escolhendo.
        </p>
      )}

      {avaliacoes.length > 0 ? (
        <ul className="ps-lista">
          {avaliacoes.map((a) => (
            <li key={a.id} className="ps-card">
              <div className="ps-card-head">
                <div>
                  <strong className="ps-autor">{a.autor_nome}</strong>
                  <span className="ps-meta">
                    {nomeModelo(a.modelo_id)}
                    {a.compra_verificada ? " · compra verificada" : ""}
                    {" · "}
                    {formatarData(a.criado_em)}
                  </span>
                </div>
                <Estrelas nota={a.nota} tamanho="sm" />
              </div>
              <p className="ps-comentario">{a.comentario}</p>
              {a.fotos.length > 0 ? (
                <ul className="ps-fotos">
                  {a.fotos.map((foto) => (
                    <li key={foto.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto.url}
                        alt={`Foto enviada por ${a.autor_nome}`}
                        loading="lazy"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {resumos.length > 1 ? (
        <ul className="ps-por-peca">
          {resumos.map((r) => (
            <li key={r.modelo_id}>
              <span>{nomeModelo(r.modelo_id)}</span>
              <span>
                {r.media.toFixed(1)} ★ · {r.total}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="ps-cta">
        <Link href="/conta/avaliar" className="btn-secondary">
          Avaliar minha compra
        </Link>
      </div>
    </section>
  );
}
