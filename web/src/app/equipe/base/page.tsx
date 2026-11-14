import type { Metadata } from "next";
import { acessoEquipe } from "@/app/equipe/acesso";
import { NavAdmin, NegadoAdmin } from "@/app/equipe/nav-admin";
import { lerBaseBot } from "@/lib/whatsapp/ia/base";
import { LIMITE_BASE } from "@/lib/whatsapp/ia/regras";
import { salvarBase } from "./acoes";

const PAGINA = "/equipe/base";

export const metadata: Metadata = { title: "Base do bot" };
export const dynamic = "force-dynamic";

const RESULTADOS: Record<string, string> = {
  salvo: "Base salva. A próxima mensagem no WhatsApp já usa este texto.",
  longo: "O texto passou de 12 mil caracteres. Encurte e salve de novo.",
  falha: "Não foi possível salvar. Atualize a página e tente novamente.",
};

const DATA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function BaseDoBotPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const acesso = await acessoEquipe(PAGINA);
  if (acesso.tipo !== "ok" || !acesso.perfis.includes("admin")) {
    return <NegadoAdmin titulo="Base do bot" aviso="Esta tela é só da administração." />;
  }

  const { resultado } = await searchParams;
  const feedback = resultado && Object.hasOwn(RESULTADOS, resultado) ? RESULTADOS[resultado] : null;
  const base = await lerBaseBot().catch((erro: unknown) => {
    console.error("Falha ao ler a base do bot", erro);
    return null;
  });

  return (
    <main id="conteudo" tabIndex={-1}>
      <h1>Base do bot</h1>
      <NavAdmin atual={PAGINA} />
      <p className="equipe-lead">
        Este texto ensina o atendimento do WhatsApp a falar da pré-reserva e do jeito da loja trabalhar.
        O bot continua sem inventar a data do voucher, o nome do aplicativo ou se uma peça está no estoque.
      </p>
      {feedback ? <p className="equipe-aviso" role="status">{feedback}</p> : null}
      {base ? (
        <form className="equipe-base" action={salvarBase}>
          <label htmlFor="base-bot">
            Conhecimento da loja, até {LIMITE_BASE.toLocaleString("pt-BR")} caracteres
          </label>
          <textarea id="base-bot" name="texto" maxLength={LIMITE_BASE} defaultValue={base.texto} />
          {base.atualizadoEm ? (
            <p className="equipe-lead">
              Atualizado em {DATA.format(new Date(base.atualizadoEm))}
              {base.autor ? ` por ${base.autor}` : ""}.
            </p>
          ) : null}
          <button className="btn-secondary" type="submit">Salvar base</button>
        </form>
      ) : (
        <p className="equipe-aviso">Não foi possível carregar a base. Confira se a atualização do banco foi aplicada.</p>
      )}
    </main>
  );
}
