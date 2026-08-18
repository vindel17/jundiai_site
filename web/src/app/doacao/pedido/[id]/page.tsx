import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  confirmarEntrega,
  responderPedido,
} from "@/app/doacao/acoes";
import { BotaoAcao } from "@/components/botao-acao";
import { formatarCelular } from "@/lib/telefone";
import { linkWhatsApp, urlFotoAnuncio } from "@/lib/doacao/foto";
import { nomeDoModelo } from "@/lib/doacao/modelos";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PedidoPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
};

export default async function PedidoDoacaoPage({
  params,
  searchParams,
}: PedidoPageProps) {
  const { id } = await params;
  const { aviso } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?proximo=/doacao/pedido/${id}`);

  const { data: doacao } = await supabase
    .from("doacao")
    .select(
      "id, status, aceito_em, doador_id, receptor_id, doador_confirmou_em, receptor_confirmou_em, anuncio_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!doacao) notFound();

  const { data: anuncio } = await supabase
    .from("anuncio")
    .select("modelo_id, tamanho, escola, estado, quantidade, foto_path")
    .eq("id", doacao.anuncio_id)
    .maybeSingle();

  if (!anuncio) notFound();

  const souDoador = doacao.doador_id === user.id;
  const foto = urlFotoAnuncio(anuncio.foto_path);
  const aceito = Boolean(doacao.aceito_em) && doacao.status !== "cancelada";

  let contato: { nome: string | null; telefone: string; papel: string } | null =
    null;
  if (aceito) {
    const { data } = await supabase.rpc("contato_da_doacao", {
      p_doacao_id: id,
    });
    contato = data?.[0] ?? null;
  }

  const euConfirmei = souDoador
    ? Boolean(doacao.doador_confirmou_em)
    : Boolean(doacao.receptor_confirmou_em);

  return (
    <main className="uj-page">
      <Link href="/conta" className="uj-back">
        ← Minha conta
      </Link>
      <h1 className="uj-page-title">
        {nomeDoModelo(anuncio.modelo_id)} · tam. {anuncio.tamanho}
      </h1>
      <p className="uj-page-lead">
        {anuncio.quantidade} {anuncio.quantidade === 1 ? "peça" : "peças"} ·
        estado {anuncio.estado} · {anuncio.escola}
      </p>

      {aviso ? (
        <p className="entrar-erro" role="alert">
          {aviso}
        </p>
      ) : null}

      {foto ? (
        <div className="doacao-pedido-foto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt={nomeDoModelo(anuncio.modelo_id)} />
        </div>
      ) : null}

      {doacao.status === "cancelada" ? (
        <div className="uj-success">
          <h2>Esse pedido não segue</h2>
          <p>O doador recusou ou a peça foi para outra família.</p>
          <Link href="/doacao/receber" className="btn-primary">
            Ver outras peças
          </Link>
        </div>
      ) : null}

      {doacao.status === "concluida" ? (
        <div className="uj-success">
          <h2>Doação concluída</h2>
          <p>
            {souDoador
              ? "Obrigado. Essa entrega entra no seu placar 2→1."
              : "A peça é sua. Cuide bem — ela já vestiu outra criança da rede."}
          </p>
          <Link href="/conta" className="btn-primary">
            Voltar para a conta
          </Link>
        </div>
      ) : null}

      {doacao.status === "combinando" && !aceito ? (
        souDoador ? (
          <section className="doacao-pedido-acoes">
            <p>
              Uma família pediu esta peça. Se você aceitar, o WhatsApp dos dois
              aparece para combinarem a retirada.
            </p>
            <form action={responderPedido} className="doacao-pedido-botoes">
              <input type="hidden" name="doacaoId" value={id} />
              <BotaoAcao
                name="aceitar"
                value="1"
                pendenteLabel="Liberando contato..."
              >
                Aceitar e liberar contato
              </BotaoAcao>
              <BotaoAcao
                name="aceitar"
                value="0"
                className="entrar-voltar"
                pendenteLabel="Recusando..."
              >
                Recusar
              </BotaoAcao>
            </form>
          </section>
        ) : (
          <div className="uj-success">
            <h2>Pedido enviado</h2>
            <p>
              O doador ainda não aceitou. Quando aceitar, o WhatsApp dele
              aparece aqui para vocês combinarem a retirada.
            </p>
          </div>
        )
      ) : null}

      {doacao.status === "combinando" && aceito && contato ? (
        <section className="doacao-contato">
          <h2>Combinem a retirada</h2>
          <p>
            Fale com {contato.nome || "a outra família"} no WhatsApp. Depois que
            a peça mudar de mão, os dois confirmam aqui.
          </p>
          <a
            className="btn-primary"
            href={linkWhatsApp(contato.telefone)}
            target="_blank"
            rel="noreferrer"
          >
            Chamar {formatarCelular(contato.telefone)}
          </a>
        </section>
      ) : null}

      {doacao.status === "combinando" && aceito ? (
        <section className="doacao-pedido-acoes">
          {euConfirmei ? (
            <p>Você já confirmou. Esperando a outra família confirmar também.</p>
          ) : (
            <>
              <p>
                A peça já foi entregue? Os dois precisam confirmar para a doação
                valer no placar.
              </p>
              <form action={confirmarEntrega}>
                <input type="hidden" name="doacaoId" value={id} />
                <BotaoAcao pendenteLabel="Confirmando...">
                  Confirmar que a peça foi entregue
                </BotaoAcao>
              </form>
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}
