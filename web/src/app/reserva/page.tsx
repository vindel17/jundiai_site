import type { Metadata } from "next";
import Link from "next/link";
import { ReservaForm } from "@/app/reserva/reserva-form";
import { VitrinePecas } from "@/app/reserva/reserva-pecas";
import { KitsSeparados } from "@/app/reserva/reserva-separados";
import { getWhatsAppUrl, SITE } from "@/lib/constants";
import { siteUrl } from "@/lib/config-publica";
import { urlIndicacao } from "@/lib/indicacao/regras";
import { listarReservasDoTelefone } from "@/lib/reserva/consultas";
import { fotoDoKit } from "@/lib/reserva/fotos";
import { reservaAberta } from "@/lib/reserva/kit";
import { adminConfigurado } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reserva Voucher",
  description: `Separe o uniforme escolar de ${SITE.city} no tamanho certo, sem pagar agora. O aviso chega quando o voucher abrir.`,
};

export const dynamic = "force-dynamic";

const GARANTIAS: { destaque: string; texto: string }[] = [
  {
    destaque: "Uniforme garantido antes das aulas.",
    texto: "O kit fica separado no tamanho certo para o(a) seu(sua) filho(a).",
  },
  { destaque: "Nada para pagar hoje.", texto: "A reserva não obriga a compra." },
  { destaque: "O kit completo tem entrega grátis em casa", texto: "ou você retira na loja." },
  { destaque: "Errou o número?", texto: "Dá para ajustar até 31 de dezembro." },
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
  const whatsapp = getWhatsAppUrl("Quero separar o uniforme do meu filho");

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
        <h1 className="uj-page-title">Garanta o uniforme antes das aulas</h1>
        <p className="uj-page-lead">
          A Espaço Livre é {SITE.credenciamento.toLowerCase()} de {SITE.city}. Escolha a escola e
          o tamanho das peças, sem pagar agora. A gente separa o kit e avisa quando o voucher
          abrir, no meio de janeiro. Aí você paga com o crédito e recebe em casa ou retira na loja.
        </p>
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

        {!user ? (
          <div className="reserva-cta">
            <Link href="/entrar?proximo=/reserva" className="btn-primary">
              Separar os tamanhos
            </Link>
            {whatsapp !== "#" ? (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-secondary">
                Prefiro fazer pelo WhatsApp
              </a>
            ) : null}
            <p className="reserva-dica">
              Já separou pelo WhatsApp? Entre com o mesmo número e o kit aparece aqui.
            </p>
          </div>
        ) : null}
      </header>

      <div className="reserva-corpo">
        {feita ? (
          <div className="uj-success" role="status">
            <h2>Kit separado!</h2>
            <p>Em janeiro avisamos no WhatsApp, quando o voucher abrir.</p>
          </div>
        ) : null}

        <KitsSeparados linhas={linhas} link={codigo ? urlIndicacao(siteUrl(), codigo) : ""} />

        {user && aberta ? (
          <>
            <div>
              <h2 className="reserva-titulo-bloco">De quem é o uniforme?</h2>
              <p className="reserva-dica">
                Um(a) aluno(a) por vez. Para outro(a) aluno(a), é só repetir depois.
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
            {user ? (
              <p className="uj-page-lead">
                As reservas foram até 31 de dezembro. Se o seu kit já está separado, o aviso
                de janeiro chega no WhatsApp.
              </p>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
