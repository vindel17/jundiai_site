import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { KitsSeparados } from "@/app/reserva/reserva-separados";
import { BotaoAcao } from "@/components/botao-acao";
import { AvaliarCompraCard } from "@/components/conta/conta-blocos";
import { IndicacaoCard } from "@/components/conta/indicacao-card";
import { VincularIndicacaoAoMontar } from "@/components/conta/vincular-indicacao";
import { siteUrl } from "@/lib/config-publica";
import { urlIndicacao } from "@/lib/indicacao/regras";
import { listarReservasDoTelefone } from "@/lib/reserva/consultas";
import { adminConfigurado } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatarCelular } from "@/lib/telefone";
import { sair } from "./acoes";

export const metadata: Metadata = {
  title: "Minha conta",
};

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let linhas: Awaited<ReturnType<typeof listarReservasDoTelefone>>["linhas"] = [];
  let codigo = "";
  if (user?.phone && adminConfigurado()) {
    try {
      const minhas = await listarReservasDoTelefone(user.phone);
      linhas = minhas.linhas;
      codigo = minhas.codigo;
    } catch {
      linhas = [];
    }
  }

  const { data: indicacaoLinhas } = await supabase.rpc("placar_indicacao");
  const ind = indicacaoLinhas?.[0];
  const hdrs = await headers();
  const origem = siteUrl(
    hdrs.get("x-forwarded-host") ?? hdrs.get("host"),
    hdrs.get("x-forwarded-proto"),
  );

  return (
    <main className="entrar-page">
      <VincularIndicacaoAoMontar />
      <span className="uj-kicker">
        WhatsApp verificado · {formatarCelular(user?.phone ?? "")}
      </span>
      <h1 className="entrar-title">Minha conta</h1>
      <p className="entrar-lead">
        A reserva do uniforme e o que você já separou neste número.
      </p>

      <div className="conta-blocos">
        {linhas.length > 0 ? (
          <KitsSeparados linhas={linhas} link={codigo ? urlIndicacao(origem, codigo) : ""} />
        ) : (
          <section className="conta-card" aria-labelledby="conta-reserva">
            <h2 id="conta-reserva">Reserva do uniforme</h2>
            <p className="conta-card-lead">
              Ainda não há reserva neste número. Escolha a escola e os tamanhos,
              sem pagar agora.
            </p>
            <div className="conta-acoes">
              <Link href="/reserva">Reservar o kit</Link>
            </div>
          </section>
        )}
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
              link: urlIndicacao(origem, ind.codigo),
            }}
          />
        ) : null}
      </div>

      <form action={sair} className="conta-sair">
        <BotaoAcao className="entrar-voltar" pendenteLabel="Saindo...">
          Sair desta conta
        </BotaoAcao>
      </form>
    </main>
  );
}
