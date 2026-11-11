import type { Metadata } from "next";
import Link from "next/link";
import { acessoEquipe } from "@/app/equipe/acesso";
import { NavAdmin, NegadoAdmin } from "@/app/equipe/nav-admin";
import { listarReservasDoTelefone } from "@/lib/reserva/consultas";
import { pode } from "@/lib/reserva/equipe";
import { rotuloStatus } from "@/lib/reserva/status";
import {
  ATENDIMENTO, ID_ATENDIMENTO, listarAtendimentos, obterAtendimento,
} from "@/lib/whatsapp/atendimento";
import { agirNoAtendimento } from "./acoes";
import { AtualizarFila, BotaoAtendimento } from "./controles";

export const metadata: Metadata = { title: "Atendimento" };
export const dynamic = "force-dynamic";

const DATA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
});
const AVISOS: Record<string, string> = {
  assumido: "Você assumiu a conversa.",
  encerrado: "Atendimento encerrado. O bot pode responder à próxima mensagem da família.",
  aceita: "Resposta aceita pelo WhatsApp.",
  recusada: "O WhatsApp recusou a resposta. Confira o histórico antes de tentar novamente.",
  incerta: "O WhatsApp não confirmou o envio. Confira a conversa antes de reenviar.",
  indisponivel: "A conversa mudou, a janela expirou ou há uma resposta em andamento.",
  texto: "Digite uma mensagem de até 4.096 caracteres.",
  falha: "A operação não foi confirmada. Confira o histórico antes de tentar novamente.",
};
const ESTADOS: Record<string, string> = {
  aceita: "Aceita pelo WhatsApp",
  recusada: "Envio recusado",
  incerta: "Envio sem confirmação",
  enviando: "Aguardando confirmação do envio",
};

function link(pagina: number, conversa: string) {
  const params = new URLSearchParams();
  if (pagina > 1) params.set("pagina", String(pagina));
  if (conversa) params.set("conversa", conversa);
  return params.size ? `${ATENDIMENTO}?${params}` : ATENDIMENTO;
}

async function conversaSelecionada(id: string) {
  const detalhe = await obterAtendimento(id);
  if (!detalhe) return null;
  const reservas = await listarReservasDoTelefone(detalhe.atendimento.wa_id).catch(() => null);
  return { ...detalhe, reservas };
}

export default async function AtendimentoPage({
  searchParams,
}: {
  searchParams: Promise<{ conversa?: string; pagina?: string; aviso?: string }>;
}) {
  const query = await searchParams;
  const id = typeof query.conversa === "string" && ID_ATENDIMENTO.test(query.conversa) ? query.conversa : "";
  const numeroPagina = Number(query.pagina);
  const pagina = Number.isInteger(numeroPagina) && numeroPagina > 0 ? Math.min(numeroPagina, 1000) : 1;
  const acesso = await acessoEquipe(link(pagina, id));
  if (acesso.tipo !== "ok" || !pode(acesso.perfis, "atendimento")) {
    return <NegadoAdmin titulo="Atendimento" aviso="Esta tela é só da administração." />;
  }

  const aviso = query.aviso && Object.hasOwn(AVISOS, query.aviso) ? AVISOS[query.aviso] : "";
  const [fila, detalhe] = await Promise.all([
    listarAtendimentos(pagina).catch(() => null),
    id ? conversaSelecionada(id).catch(() => undefined) : null,
  ]);

  const atendimento = detalhe?.atendimento;
  const aberto = atendimento && !atendimento.encerrado_em;
  const assumidoPorMim = aberto && atendimento.atendente === acesso.autor;

  return (
    <main id="conteudo" tabIndex={-1}>
      <h1>Atendimento</h1>
      <NavAdmin atual={ATENDIMENTO} />
      <AtualizarFila />
      {aviso ? <p className="equipe-lead" role="status">{aviso}</p> : null}
      <div className="atendimento-layout">
        <section aria-labelledby="fila-atendimento">
          <h2 id="fila-atendimento">Fila do WhatsApp</h2>
          {!fila ? <p className="equipe-aviso">Não foi possível carregar a fila.</p> : null}
          {fila?.filas.length === 0 ? <p className="equipe-lead">Nenhum atendimento nesta página.</p> : null}
          {fila?.filas.length ? (
            <ul className="atendimento-fila">
              {fila.filas.map((item) => (
                <li key={item.id}>
                  <Link href={link(pagina, item.id)} aria-current={id === item.id ? "page" : undefined} prefetch={false}>
                    <strong>+{item.wa_id}</strong>
                    <span>{item.atendente ? "Em atendimento" : "Na fila"} · {DATA.format(new Date(item.aberto_em))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {pagina > 1 || fila?.temMais ? (
            <nav className="equipe-paginacao" aria-label="Páginas da fila">
              {pagina > 1 ? <Link href={link(pagina - 1, id)}>Anterior</Link> : null}
              {fila?.temMais ? <Link href={link(pagina + 1, id)}>Próxima</Link> : null}
            </nav>
          ) : null}
        </section>

        {id && !detalhe ? (
          <p className="equipe-aviso">{detalhe === undefined ? "Não foi possível abrir a conversa." : "Conversa não encontrada."}</p>
        ) : null}
        {detalhe && atendimento ? (
          <section className="atendimento-conversa" aria-labelledby="conversa-atendimento">
            <h2 id="conversa-atendimento">+{atendimento.wa_id}</h2>
            <p className="equipe-lead">
              {atendimento.encerrado_em ? "Encerrado" : atendimento.atendente
                ? (assumidoPorMim ? "Em atendimento com você" : "Com outro atendente")
                : "Aguardando atendente"}
            </p>
            {detalhe.reservas?.linhas.length ? (
              <ul className="equipe-lista">
                {detalhe.reservas.linhas.map((reserva) => (
                  <li key={reserva.id}>
                    <Link href={`/equipe/reservas/${reserva.id}`}>{reserva.aluno}</Link>
                    {" · "}{reserva.escola}{" · "}{rotuloStatus(reserva.status)}
                  </li>
                ))}
              </ul>
            ) : null}
            {detalhe.reservas === null ? <p className="equipe-aviso">Não foi possível consultar as reservas.</p> : null}
            <h3>Mensagens do atendimento</h3>
            {detalhe.rascunho ? <p className="equipe-lead">Reserva em andamento · {detalhe.rascunho}</p> : null}
            <ol className="atendimento-mensagens">
              {detalhe.mensagens.map((mensagem) => (
                <li key={mensagem.id} data-origem={mensagem.origem}>
                  <small>
                    {mensagem.origem === "cliente" ? "Cliente" : "Equipe"} · {DATA.format(new Date(mensagem.criado_em))}
                    {ESTADOS[mensagem.estado] ? ` · ${ESTADOS[mensagem.estado]}` : ""}
                  </small>
                  <p>{mensagem.texto}</p>
                </li>
              ))}
            </ol>
            {aberto && !atendimento.atendente ? (
              <form action={agirNoAtendimento}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="acao" value="assumir" />
                <BotaoAtendimento rotulo="Assumir atendimento" principal />
              </form>
            ) : null}
            {assumidoPorMim ? (
              <>
                {detalhe.naJanela ? (
                  <form key={id} action={agirNoAtendimento} className="atendimento-resposta">
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="mensagem" value={detalhe.respostaId} />
                    <input type="hidden" name="acao" value="responder" />
                    <label htmlFor="resposta-atendimento">Resposta</label>
                    <textarea id="resposta-atendimento" name="texto" rows={3} maxLength={4096} required />
                    <BotaoAtendimento rotulo="Enviar resposta" principal />
                  </form>
                ) : (
                  <p className="equipe-aviso">A janela de 24 horas terminou. Uma nova mensagem da família reabre a conversa para respostas livres.</p>
                )}
                {detalhe.rascunho && detalhe.naJanela ? (
                  <p className="equipe-lead">Para retomar, peça à família que digite “continuar reserva” depois que você encerrar.</p>
                ) : null}
                <form action={agirNoAtendimento} className="atendimento-encerrar">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="acao" value="encerrar" />
                  <BotaoAtendimento rotulo="Encerrar e liberar o bot" />
                </form>
              </>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
