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
import { listarReservasDoTelefone, reservasAtivas } from "@/lib/reserva/consultas";
import { placarDaIndicacao } from "@/lib/reserva/indicacao";
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
      linhas = reservasAtivas(minhas.linhas);
      codigo = minhas.codigo;
    } catch {
      linhas = [];
    }
  }

  const { data: indicacaoLinhas } = await supabase.rpc("placar_indicacao");
  const codigoPerfil = (indicacaoLinhas?.[0]?.codigo as string | undefined) ?? "";
  const codigoLink = codigo || codigoPerfil;
  let indicados = { familias: 0, ultimaEm: null as string | null };
  if (user?.phone && codigoLink && adminConfigurado()) {
    try {
      indicados = await placarDaIndicacao(user.phone, [codigo, codigoPerfil]);
    } catch {
      indicados = { familias: 0, ultimaEm: null };
    }
  }
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
          <KitsSeparados linhas={linhas} link="" />
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
        {codigoLink ? (
          <IndicacaoCard
            placar={{
              link: urlIndicacao(origem, codigoLink),
              reservaram: indicados.familias,
              ultimaEm: indicados.ultimaEm,
            }}
          />
        ) : null}
        <AvaliarCompraCard />
      </div>

      <form action={sair} className="conta-sair">
        <BotaoAcao className="entrar-voltar" pendenteLabel="Saindo...">
          Sair desta conta
        </BotaoAcao>
      </form>
    </main>
  );
}
