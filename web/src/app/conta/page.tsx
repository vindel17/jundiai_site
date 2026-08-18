import type { Metadata } from "next";
import { headers } from "next/headers";
import { BotaoAcao } from "@/components/botao-acao";
import { PerfilForm } from "@/components/auth/perfil-form";
import {
  AvaliarCompraCard,
  MeuKitCard,
  RedeCircularCard,
  type FilhoResumo,
  type PedidoResumo,
} from "@/components/conta/conta-blocos";
import { IndicacaoCard } from "@/components/conta/indicacao-card";
import { nomeDoModelo } from "@/lib/doacao/modelos";
import { origemPublica, urlIndicacao } from "@/lib/indicacao/regras";
import { motivoDoPerfil, rotaInterna } from "@/lib/rotas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatarCelular } from "@/lib/telefone";
import { VincularIndicacaoAoMontar } from "@/components/conta/vincular-indicacao";
import { sair } from "./acoes";

export const metadata: Metadata = {
  title: "Minha conta",
};

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const destino = rotaInterna((await searchParams).proximo);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: filhos } = await supabase
    .from("filho")
    .select("id, nome, escola, tamanho_atual")
    .order("criado_em", { ascending: true });

  const { data: placarLinhas } = await supabase.rpc("placar_doacao");
  const placar = placarLinhas?.[0] ?? {
    concluidas: 0,
    contaveis: 0,
    pecas: 0,
    faltam: 2,
  };

  const { data: pedidosAbertos } = await supabase
    .from("doacao")
    .select("id, doador_id, aceito_em, anuncio:anuncio_id(modelo_id, tamanho)")
    .eq("status", "combinando")
    .order("criado_em", { ascending: false });

  const pedidos: PedidoResumo[] = (pedidosAbertos ?? []).map((row) => {
    const anuncio = Array.isArray(row.anuncio) ? row.anuncio[0] : row.anuncio;
    return {
      id: row.id,
      papel: row.doador_id === user?.id ? "doador" : "receptor",
      aceito: Boolean(row.aceito_em),
      peca: `${nomeDoModelo(anuncio?.modelo_id ?? "")} tam. ${anuncio?.tamanho ?? ""}`,
    };
  });

  const { data: indicacaoLinhas } = await supabase.rpc("placar_indicacao");
  const ind = indicacaoLinhas?.[0];
  const hdrs = await headers();
  const origem = origemPublica(
    hdrs.get("x-forwarded-host") ?? hdrs.get("host"),
    hdrs.get("x-forwarded-proto"),
  );

  const lista = (filhos ?? []) as FilhoResumo[];
  const temPerfil = lista.length > 0;

  return (
    <main className="entrar-page">
      <VincularIndicacaoAoMontar />
      <span className="uj-kicker">
        WhatsApp verificado · {formatarCelular(user?.phone ?? "")}
      </span>

      {temPerfil ? (
        <>
          <h1 className="entrar-title">Minha conta</h1>
          <p className="entrar-lead">
            Tudo o que você pode fazer para completar o uniforme, no mesmo
            lugar.
          </p>

          <div className="conta-blocos">
            <RedeCircularCard
              contaveis={placar.contaveis}
              pecas={placar.pecas}
              faltam={placar.faltam}
              pedidos={pedidos}
            />
            <AvaliarCompraCard />
            {ind?.codigo ? (
              <IndicacaoCard
                placar={{
                  codigo: ind.codigo,
                  acessos: ind.acessos ?? 0,
                  cadastros: ind.cadastros ?? 0,
                  pendenteCentavos: ind.pendente_centavos ?? 0,
                  confirmadoCentavos: ind.confirmado_centavos ?? 0,
                  camisetas: ind.camisetas ?? 0,
                  faltamCentavos: ind.faltam_centavos ?? 35000,
                  etiquetasDtf: ind.etiquetas_dtf ?? 0,
                  indicado: Boolean(ind.indicado),
                  link: urlIndicacao(origem, ind.codigo),
                }}
              />
            ) : null}
            <MeuKitCard filhos={lista} />
          </div>

          <form action={sair} className="conta-sair">
            <BotaoAcao className="entrar-voltar" pendenteLabel="Saindo...">
              Sair desta conta
            </BotaoAcao>
          </form>
        </>
      ) : (
        <>
          <h1 className="entrar-title">Falta pouco</h1>
          <p className="entrar-lead">
            {motivoDoPerfil(destino) ? (
              <b>{motivoDoPerfil(destino)} </b>
            ) : null}
            Precisamos saber para quem é o uniforme. Com a escola e o tamanho a
            gente avisa você primeiro quando a peça certa aparecer.
          </p>
          <PerfilForm proximo={destino} />
        </>
      )}
    </main>
  );
}
