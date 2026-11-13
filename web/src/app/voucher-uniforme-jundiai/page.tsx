import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DOMINIO_PADRAO } from "@/lib/config-publica";

const TITULO = "Como funciona o Auxílio Uniforme 2027 em Jundiaí";
const DESCRICAO = "Entenda como a Prefeitura planeja disponibilizar o voucher do uniforme escolar, quem o programa prevê atender e como funciona a pré-reserva.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: `https://${DOMINIO_PADRAO}/voucher-uniforme-jundiai` },
  openGraph: { title: TITULO, description: DESCRICAO, url: "/voucher-uniforme-jundiai", type: "article" },
};

export default function VoucherUniformeJundiaiPage() {
  return (
    <AppShell largo>
      <main className="uj-page">
        <article className="prose-legal mx-auto max-w-3xl">
          <h1 className="uj-page-title">{TITULO}</h1>
          <p>Informações consultadas em <time dateTime="2026-11-13">13 de novembro de 2026</time>.</p>
          <p className="uj-page-lead">
            O Auxílio Uniforme é um programa da Prefeitura de Jundiaí previsto para 2027.
            O município prevê disponibilizar um crédito eletrônico pelo aplicativo para que os
            responsáveis adquiram os uniformes em estabelecimentos credenciados.
          </p>

          <h2>Quem o programa prevê atender?</h2>
          <p>
            Segundo a Secretaria Municipal de Educação, o programa contempla alunos da Educação
            Infantil II e do Ensino Fundamental I da rede municipal de Jundiaí. A escola poderá
            orientar os responsáveis sobre o cadastro e o acesso ao benefício.
          </p>

          <h2>Quando o crédito estará disponível?</h2>
          <p>
            As fontes municipais consultadas ainda não indicavam uma data de liberação para as
            famílias. Acompanhe o cronograma divulgado pela Prefeitura e as orientações da escola.
          </p>
          <ul>
            <li><a className="underline" href="https://jundiai.sp.gov.br/noticias/2026/09/23/educacao-reune-diretoras-para-orientar-sobre-funcionamento-do-voucher-dos-uniformes-escolares/">Orientações da Secretaria Municipal de Educação sobre o voucher</a></li>
            <li><a className="underline" href="https://observatorio.jundiai.sp.gov.br/detalhes_entrega.php?setor=sme">Andamento do projeto no Observatório Jundiaí</a></li>
          </ul>

          <h2>Como funciona a pré-reserva na Uniforme Jundiaí?</h2>
          <p>
            A pré-reserva é gratuita. Você informa a escola, escolhe as peças e os tamanhos e
            confirma pelo site ou pelo WhatsApp. A loja deixa o kit separado e avisa pelo
            WhatsApp quando o voucher liberar. O cadastro para receber o crédito segue as
            orientações da Prefeitura.
          </p>
          <p><Link className="underline" href="/guia-de-tamanhos">Veja como medir as peças e escolher os tamanhos.</Link></p>
          <Link className="btn-primary" href="/reserva">Ver a pré-reserva</Link>
        </article>
      </main>
    </AppShell>
  );
}
