import Link from "next/link";
import { DATA_EQUIPE } from "@/app/equipe/data";
import { mudarStatusReservas } from "@/app/equipe/reservas/acoes";
import { consultaDoFiltro, hrefReservas } from "@/app/equipe/reservas/filtros";
import { MarcarPagina } from "@/app/equipe/reservas/marcar";
import {
  RESERVAS_POR_PAGINA,
  listarReservas,
  type FiltroReservas,
  type ReservaLinha,
} from "@/lib/reserva/consultas";
import { rotuloEntrega } from "@/lib/reserva/entrega";
import { type PerfilEquipe } from "@/lib/reserva/equipe";
import { destinosDoLote } from "@/lib/reserva/gestao";
import { kitCompleto, pecasDoKit, rotuloKit, rotuloTamanho } from "@/lib/reserva/kit";
import { CANAIS_ORIGEM, rotuloCanal } from "@/lib/reserva/origem";
import { STATUS_RESERVA, rotuloStatus } from "@/lib/reserva/status";
import { adminConfigurado } from "@/lib/supabase/admin";

function telefoneVisivel(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length < 10) return valor;
  return digitos.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
}

export async function Lista({
  filtro,
  perfis,
}: {
  filtro: FiltroReservas;
  perfis: PerfilEquipe[];
}) {
  if (!adminConfigurado()) {
    return <p className="equipe-aviso">Falta a chave do banco para a equipe ler as reservas.</p>;
  }

  let resultado: Awaited<ReturnType<typeof listarReservas>>;
  try {
    resultado = await listarReservas(filtro);
  } catch {
    return (
      <p className="equipe-aviso">A lista ainda não está no banco. Aplique a migração das reservas.</p>
    );
  }

  const { linhas, total } = resultado;
  const pagina = filtro.pagina ?? 1;
  const paginas = Math.max(1, Math.ceil(total / RESERVAS_POR_PAGINA));
  const destinos = destinosDoLote(perfis);
  const lote = destinos.length > 0 && linhas.length > 0;

  return (
    <>
      <form className="equipe-filtros" action="/equipe/reservas">
        <label>
          Busca
          <input name="busca" defaultValue={filtro.busca} placeholder="Nome ou telefone" />
        </label>
        <label>
          Escola
          <input name="escola" defaultValue={filtro.escola} placeholder="Trecho do nome" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filtro.status}>
            <option value="">Todos</option>
            {STATUS_RESERVA.map((status) => (
              <option key={status} value={status}>
                {rotuloStatus(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Origem
          <select name="canal" defaultValue={filtro.canal}>
            <option value="">Todas</option>
            {CANAIS_ORIGEM.map((item) => (
              <option key={item} value={item}>
                {rotuloCanal(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kit
          <select name="kit" defaultValue={filtro.kit}>
            <option value="">Todos</option>
            <option value="masculino">{rotuloKit("masculino")}</option>
            <option value="feminino">{rotuloKit("feminino")}</option>
          </select>
        </label>
        <label>
          Receber
          <select name="entrega" defaultValue={filtro.entrega}>
            <option value="">Todos</option>
            <option value="casa">Receber em casa</option>
            <option value="loja">Retirar na loja</option>
            <option value="nao">Não informado</option>
          </select>
        </label>
        <button className="btn-primary" type="submit">
          Filtrar
        </button>
      </form>

      {linhas.length === 0 ? (
        <p className="equipe-lead">Nenhuma reserva com esse filtro.</p>
      ) : lote ? (
        <form action={mudarStatusReservas}>
          <input type="hidden" name="volta" value="/equipe/reservas" />
          <input type="hidden" name="consulta" value={consultaDoFiltro(filtro)} />
          <div className="equipe-filtros">
            <label>
              Novo status
              <select name="para" defaultValue={destinos[0]} required>
                {destinos.map((status) => (
                  <option key={status} value={status}>
                    {rotuloStatus(status)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Observação
              <input name="observacao" maxLength={500} placeholder="Opcional" />
            </label>
            <button className="btn-primary" type="submit">
              Aplicar
            </button>
          </div>
          <Tabela linhas={linhas} lote />
        </form>
      ) : (
        <Tabela linhas={linhas} lote={false} />
      )}

      <p className="equipe-paginacao">
        {total === 1 ? "1 reserva." : `${total} reservas.`} Página {pagina} de {paginas}.
        {pagina > 1 ? (
          <Link href={hrefReservas({ ...filtro, pagina: pagina - 1 })}>Anterior</Link>
        ) : null}
        {pagina < paginas ? (
          <Link href={hrefReservas({ ...filtro, pagina: pagina + 1 })}>Próxima</Link>
        ) : null}
      </p>
    </>
  );
}

function Tabela({ linhas, lote }: { linhas: ReservaLinha[]; lote: boolean }) {
  return (
    <div className="equipe-tabela-wrap">
      <table className="equipe-tabela">
        <thead>
          <tr>
            {lote ? (
              <th>
                <MarcarPagina />
              </th>
            ) : null}
            <th>Quando</th>
            <th>Aluno</th>
            <th>Escola</th>
            <th>Status</th>
            <th>Origem</th>
            <th>Tamanhos</th>
            <th>Receber</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.id}>
              {lote ? (
                <td>
                  <input type="checkbox" name="ids" value={linha.id} aria-label={linha.aluno} />
                </td>
              ) : null}
              <td>{DATA_EQUIPE.format(new Date(linha.criadoEm))}</td>
              <td>
                <Link href={`/equipe/reservas/${linha.id}`}>{linha.aluno}</Link>
                <div>{rotuloKit(linha.kit)}</div>
                <div>{telefoneVisivel(linha.telefone)}</div>
              </td>
              <td>{linha.escola}</td>
              <td>{rotuloStatus(linha.status)}</td>
              <td>
                {rotuloCanal(linha.origemCanal)}
                {linha.origemCodigo ? ` · ${linha.origemCodigo}` : ""}
              </td>
              <td>
                {pecasDoKit(linha.kit).map((peca) => (
                  <div key={peca.chave}>
                    {peca.nome}: {rotuloTamanho(linha.tamanhos[peca.chave])}
                  </div>
                ))}
              </td>
              <td>
                {linha.entrega
                  ? rotuloEntrega(linha.entrega, kitCompleto(linha.tamanhos))
                  : "Não informado"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
