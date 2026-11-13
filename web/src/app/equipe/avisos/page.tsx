import type { Metadata } from "next";
import { acessoEquipe } from "@/app/equipe/acesso";
import { NavAdmin, NegadoAdmin } from "@/app/equipe/nav-admin";
import {
  envioVoucherConfigurado,
  proximoLoteVoucher,
  resumoAvisoVoucher,
  TEXTO_AVISO_VOUCHER,
} from "@/lib/reserva/aviso-voucher";
import { dispararLoteVoucher, prepararFilaVoucher, recolocarRecusados } from "./acoes";

const PAGINA = "/equipe/avisos";

export const metadata: Metadata = { title: "Aviso do voucher" };
export const dynamic = "force-dynamic";

const RESULTADOS: Record<string, string> = {
  indisponivel: "O envio está desativado.",
  confirmar: "Confirme que a Prefeitura liberou o voucher.",
  atualizar: "O total de famílias mudou. Confira os números atualizados.",
  preparado: "Fila preparada. Confira abaixo quantas famílias estão prontas para receber o aviso.",
  processado: "Lote processado. Atualize a página para acompanhar as entregas.",
  interrompido: "O processamento foi interrompido. Confira o resultado antes de continuar com o próximo lote.",
  falha: "Não foi possível preparar a fila. Atualize a página e tente novamente.",
  recolocado: "As mensagens recusadas que ainda são elegíveis voltaram para a fila.",
};

export default async function AvisosPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string }>;
}) {
  const acesso = await acessoEquipe(PAGINA);
  if (acesso.tipo !== "ok" || !acesso.perfis.includes("admin")) {
    return <NegadoAdmin titulo="Aviso do voucher" aviso="Esta tela é só da administração." />;
  }

  const { resultado } = await searchParams;
  const feedback = resultado && Object.hasOwn(RESULTADOS, resultado) ? RESULTADOS[resultado] : null;
  const configurado = envioVoucherConfigurado();
  const dados = await Promise.all([resumoAvisoVoucher(), proximoLoteVoucher()]).catch((erro) => {
    console.error("Falha ao consultar a fila do voucher", erro);
    return null;
  });
  const [resumo, ids] = dados ?? [];

  return (
    <main id="conteudo" tabIndex={-1}>
      <h1>Aviso do voucher 2027</h1>
      <NavAdmin atual={PAGINA} />
      {feedback ? <p className="equipe-aviso" role="status">{feedback}</p> : null}

      <h2>Mensagem no WhatsApp</h2>
      <blockquote className="equipe-lead whitespace-pre-wrap">{TEXTO_AVISO_VOUCHER}</blockquote>

      {resumo && ids ? (
        <>
          <h2>Famílias e entregas</h2>
          <ul className="equipe-lista">
            <li>{resumo.familias} com pré-reserva ativa</li>
            <li>{resumo.sem_aceite} sem autorização para receber o aviso</li>
            <li>{resumo.a_preparar} autorizadas para inclusão na fila</li>
            <li>{resumo.pendentes} na fila para envio</li>
            <li>{resumo.em_envio} em processamento</li>
            <li>{resumo.enviados} aceitas pela Meta, aguardando confirmação de entrega</li>
            <li>{resumo.entregues} entregues</li>
            <li>{resumo.falhas} com falha confirmada</li>
            <li>{resumo.incertos} com resultado incerto</li>
          </ul>
          {!configurado ? <p className="equipe-aviso">Envio desativado neste ambiente.</p> : null}
          {configurado && resumo.a_preparar > 0 ? (
            <form className="equipe-filtros" action={prepararFilaVoucher.bind(null, resumo.a_preparar)}>
              <ConfirmacaoOficial />
              <button className="btn-secondary" type="submit">
                Preparar fila para {resumo.a_preparar} {resumo.a_preparar === 1 ? "família" : "famílias"}
              </button>
            </form>
          ) : null}
          {configurado && ids.length > 0 ? (
            <form className="equipe-filtros" action={dispararLoteVoucher.bind(null, ids)}>
              <ConfirmacaoOficial />
              <button className="btn-primary" type="submit">
                Enviar aviso para {ids.length} {ids.length === 1 ? "família" : "famílias"}
              </button>
            </form>
          ) : null}
          {configurado && resumo.recusados > 0 ? (
            <form className="equipe-filtros" action={recolocarRecusados}>
              <ConfirmacaoOficial />
              <button className="btn-secondary" type="submit">
                Voltar {resumo.recusados} à fila após recusa da Meta
              </button>
            </form>
          ) : null}
        </>
      ) : <p className="equipe-aviso">Não foi possível consultar a fila do voucher.</p>}
    </main>
  );
}

function ConfirmacaoOficial() {
  return (
    <label className="equipe-confirmacao">
      <input type="checkbox" name="liberado" value="sim" required />
      Confirmo que a Prefeitura liberou o voucher para uso.
    </label>
  );
}
