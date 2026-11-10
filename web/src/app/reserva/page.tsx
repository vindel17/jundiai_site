import type { Metadata } from "next";
import Link from "next/link";
import { ReservaForm } from "@/app/reserva/reserva-form";
import { VitrinePecas } from "@/app/reserva/reserva-pecas";
import { KitsSeparados } from "@/app/reserva/reserva-separados";
import { getWhatsAppUrl, SITE } from "@/lib/constants";
import { siteUrl } from "@/lib/config-publica";
import { PESSOAS_POR_PECA_EXTRA, urlIndicacao } from "@/lib/indicacao/regras";
import { listarReservasDoTelefone } from "@/lib/reserva/consultas";
import { fotoDoKit } from "@/lib/reserva/fotos";
import { reservaAberta } from "@/lib/reserva/kit";
import { adminConfigurado } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reserve o uniforme escolar",
  description: `Evite a correria da volta às aulas em ${SITE.city}. Escolha os tamanhos do uniforme com calma e faça a reserva sem pagar nada agora.`,
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
  const whatsapp = getWhatsAppUrl(
    aberta ? "Quero reservar o uniforme escolar" : "Tenho uma dúvida sobre o uniforme escolar",
  );

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

  return (
    <main className="reserva">
      <header className="reserva-intro">
        <span className="uj-kicker">{SITE.credenciamento}</span>
        <h1 className="uj-page-title">
          {aberta ? "Seu kit separado para quando o voucher liberar" : "O prazo para reservar terminou"}
        </h1>
        <p className="uj-page-lead">
          {aberta
            ? "Faça a reserva de graça. Quando o crédito da Prefeitura estiver disponível, a gente avisa pelo WhatsApp."
            : "Se você já fez a reserva, pode ver os detalhes aqui."}
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
