import type { Metadata } from "next";
import Link from "next/link";
import { ReservaForm } from "@/app/reserva/reserva-form";
import { VitrinePecas } from "@/app/reserva/reserva-pecas";
import { KitsSeparados } from "@/app/reserva/reserva-separados";
import { codigoDoCookie } from "@/app/conta/indicacao-acoes";
import { getWhatsAppUrl, SITE } from "@/lib/constants";
import { DOMINIO_PADRAO, siteUrl } from "@/lib/config-publica";
import {
  PESSOAS_POR_PECA_EXTRA,
  textoConvite,
  textoPremioIndicacao,
  urlIndicacao,
} from "@/lib/indicacao/regras";
import { listarReservasDoTelefone, reservasAtivas } from "@/lib/reserva/consultas";
import { fotoDoKit } from "@/lib/reserva/fotos";
import { reservaAberta } from "@/lib/reserva/kit";
import { adminConfigurado } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TITULO_RESERVA = "Uniforme escolar da rede municipal de Jundiaí 2027";
const DESCRICAO_RESERVA = "Veja as peças do kit, escolha os tamanhos e faça a pré-reserva gratuita. Receba pelo WhatsApp o aviso de quando puder usar o voucher.";
const URL_RESERVA = `https://${DOMINIO_PADRAO}/reserva`;

export const metadata: Metadata = {
  title: { absolute: TITULO_RESERVA },
  description: DESCRICAO_RESERVA,
  alternates: { canonical: URL_RESERVA },
  openGraph: {
    title: TITULO_RESERVA,
    description: DESCRICAO_RESERVA,
    url: URL_RESERVA,
    siteName: SITE.name,
    locale: "pt_BR",
    type: "website",
    images: [{
      url: `https://${DOMINIO_PADRAO}/produtos/kit-masculino.jpg`,
      width: 1448,
      height: 1086,
      alt: "Peças do kit de uniforme escolar com bermuda da rede municipal de Jundiaí",
    }],
  },
};

export const dynamic = "force-dynamic";

const GARANTIAS: { destaque: string; texto: string }[] = [
  {
    destaque: "Economize uma ida à loja.",
    texto: "Com o kit completo, a entrega em casa é de graça. Se preferir, retire na loja.",
  },
  {
    destaque: "Camiseta extra de presente.",
    texto: `Ganhe uma a cada ${PESSOAS_POR_PECA_EXTRA} pessoas que reservarem pelo seu link e comprarem o kit.`,
  },
  {
    destaque: "Precisa mudar algum tamanho?",
    texto: "Você pode trocar antes de comprar, se tivermos a peça no tamanho que você precisa.",
  },
  {
    destaque: "O uniforme não serviu?",
    texto: "Depois da compra, você pode pedir a troca ou a devolução.",
  },
];

export default async function ReservaPage({
  searchParams,
}: {
  searchParams: Promise<{ feita?: string }>;
}) {
  const { feita } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const aberta = reservaAberta();
  const convite = await codigoDoCookie();
  const whatsapp = getWhatsAppUrl(
    aberta
      ? convite
        ? `Vim pela indicacao ${convite}`
        : "Quero reservar o uniforme escolar"
      : "Tenho uma dúvida sobre o uniforme escolar",
  );

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

  return (
    <main className="reserva">
      <header className="reserva-intro">
        <h1 className="uj-page-title">{TITULO_RESERVA}</h1>
        <p className="uj-page-lead">
          {aberta
            ? "Escolha os tamanhos e faça a pré-reserva gratuita, sem compromisso de compra. Quando você puder usar o voucher da Prefeitura, a gente avisa pelo WhatsApp."
            : "O prazo para reservar terminou. Se você já fez a reserva, pode ver os detalhes aqui."}
        </p>
        {aberta ? (
          <ul className="uj-checklist">
            {GARANTIAS.map((item) => (
              <li key={item.destaque}>
                <span className="uj-check" aria-hidden>
                  ✓
                </span>
                <span>
                  <b>{item.destaque}</b> {item.texto}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {!user ? (
          <div className="reserva-cta">
            <Link href="/entrar?proximo=/reserva" className="btn-primary">
              {aberta ? "Reservar uniforme" : "Ver minha reserva"}
            </Link>
            {whatsapp !== "#" ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-secondary">
                {aberta ? "Reservar pelo WhatsApp" : "Falar pelo WhatsApp"}
              </a>
            ) : null}
            <p className="reserva-dica">
              Já reservou pelo WhatsApp? Entre com o mesmo número para ver sua reserva.
            </p>
          </div>
        ) : null}
        {!aberta ? (
          <p className="reserva-dica">
            Em janeiro, a gente avisa pelo WhatsApp quando você puder usar o voucher
            (o crédito da Prefeitura para comprar o uniforme).
          </p>
        ) : null}
      </header>

      <div className="reserva-corpo">
        {feita ? (
          <div className="uj-success" role="status">
            <h2>Reserva feita!</h2>
            <p>Em janeiro, a gente avisa pelo WhatsApp quando você puder usar o voucher.</p>
            {codigo ? (
              <LinkDaReserva codigo={codigo} />
            ) : null}
          </div>
        ) : null}

        <KitsSeparados linhas={linhas} link={codigo ? urlIndicacao(siteUrl(), codigo) : ""} />

        {user && aberta ? (
          <>
            <div>
              <h2 className="reserva-titulo-bloco">De quem é o uniforme?</h2>
              <p className="reserva-dica">
                Faça uma reserva por estudante. Se precisar de mais de um uniforme,
                você pode fazer outra reserva depois.
              </p>
            </div>
            <ReservaForm
              fotosKit={{ masculino: fotoDoKit("masculino"), feminino: fotoDoKit("feminino") }}
            />
          </>
        ) : (
          <>
            <h2 className="reserva-titulo-bloco">O que vem no kit</h2>
            <VitrinePecas />
          </>
        )}
      </div>
    </main>
  );
}

function LinkDaReserva({ codigo }: { codigo: string }) {
  const link = urlIndicacao(siteUrl(), codigo);
  return (
    <>
      <p>Este é o seu link. {textoPremioIndicacao()}</p>
      <p className="reserva-link">
        <a href={link}>{link}</a>
      </p>
      <div className="conta-acoes">
        <a
          className="btn-primary"
          href={`https://wa.me/?text=${encodeURIComponent(textoConvite(link))}`}
          target="_blank"
          rel="noreferrer"
        >
          Mandar meu link no WhatsApp
        </a>
      </div>
    </>
  );
}
