import Link from "next/link";
import { TAMANHOS } from "@/data/catalogo";
import {
  DOACAO_MODELOS,
  qsReceber,
  type FiltroReceber,
} from "@/lib/doacao/modelos";

const TAMANHOS_RAPIDOS = ["8", "10", "12", "14"] as const;

export function FeedFiltros({ filtro }: { filtro: FiltroReceber }) {
  const temFiltro = Boolean(filtro.modelo || filtro.tamanho || filtro.escola);

  return (
    <>
      <div className="doacao-chips" role="group" aria-label="Filtro rápido por tamanho">
        <Link
          href={qsReceber(filtro, { tamanho: undefined })}
          className="doacao-chip"
          data-active={!filtro.tamanho ? "true" : "false"}
        >
          Todos os tamanhos
        </Link>
        {TAMANHOS_RAPIDOS.map((t) => (
          <Link
            key={t}
            href={qsReceber(filtro, {
              tamanho: filtro.tamanho === t ? undefined : t,
            })}
            className="doacao-chip"
            data-active={filtro.tamanho === t ? "true" : "false"}
          >
            Tam. {t}
          </Link>
        ))}
      </div>

      <form className="doacao-filters" action="/doacao/receber" method="get">
        <div className="uj-field-row">
          <div className="uj-field">
            <label htmlFor="filtro-modelo">Peça</label>
            <select id="filtro-modelo" name="modelo" defaultValue={filtro.modelo ?? ""}>
              <option value="">Todas</option>
              {DOACAO_MODELOS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="uj-field">
            <label htmlFor="filtro-tamanho">Tamanho</label>
            <select
              id="filtro-tamanho"
              name="tamanho"
              defaultValue={filtro.tamanho ?? ""}
            >
              <option value="">Todos</option>
              {TAMANHOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="uj-field">
          <label htmlFor="filtro-escola">Escola</label>
          <input
            id="filtro-escola"
            name="escola"
            defaultValue={filtro.escola ?? ""}
            placeholder="Digite parte do nome — ex.: Alceu"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="doacao-reset">
          Aplicar filtros
        </button>
      </form>

      {temFiltro ? (
        <p className="doacao-results">
          <span />
          <Link href="/doacao/receber" className="doacao-reset">
            Limpar filtros
          </Link>
        </p>
      ) : null}
    </>
  );
}
