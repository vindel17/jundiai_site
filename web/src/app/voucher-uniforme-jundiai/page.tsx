import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DOMINIO_PADRAO } from "@/lib/config-publica";

const TITULO = "Voucher Uniforme Escolar Jundiaí 2027: como funciona, quem tem direito e onde comprar";
const DESCRICAO = "Entenda o Programa Auxílio Uniforme da Prefeitura de Jundiaí, saiba como funcionará o crédito eletrônico e conheça a possibilidade de reservar os uniformes escolares antecipadamente.";
const TITULO_SEO = "Voucher Uniforme Jundiaí 2027: Como Funciona e Pré-Reserva";
const DESCRICAO_SEO = "Entenda o voucher de uniforme escolar de Jundiaí 2027: público atendido, aplicativo e informações oficiais. Faça sua pré-reserva gratuita na Uniforme Jundiaí.";

const FONTES = [
  {
    titulo: "Prefeitura prepara voucher para uniformes escolares em 2027 — 26/08/2026",
    href: "https://jundiai.sp.gov.br/noticias/2026/08/26/prefeitura-prepara-voucher-para-uniformes-escolares-em-2027-e-se-reunira-com-confeccoes/",
  },
  {
    titulo: "Educação orienta diretoras sobre o funcionamento do voucher — 23/09/2026",
    href: "https://jundiai.sp.gov.br/noticias/2026/09/23/educacao-reune-diretoras-para-orientar-sobre-funcionamento-do-voucher-dos-uniformes-escolares/",
  },
  {
    titulo: "Prefeitura apresenta avanço do credenciamento — 26/10/2026",
    href: "https://jundiai.sp.gov.br/noticias/2026/10/26/prefeitura-apresenta-linha-de-credito-do-banco-do-povo-para-confeccoes-que-produzirao-uniformes-escolares-em-jundiai/",
  },
] as const;

export const metadata: Metadata = {
  title: { absolute: TITULO_SEO },
  description: DESCRICAO_SEO,
  alternates: { canonical: `https://${DOMINIO_PADRAO}/voucher-uniforme-jundiai` },
  openGraph: { title: TITULO_SEO, description: DESCRICAO_SEO, url: "/voucher-uniforme-jundiai", type: "article" },
};

export default function VoucherUniformeJundiaiPage() {
  return (
    <AppShell largo>
      <main className="uj-page">
        <article className="prose-legal mx-auto max-w-3xl">
          <h1 className="uj-page-title">{TITULO}</h1>
          <p className="uj-page-lead">{DESCRICAO}</p>
          <p>
            <em>Informações atualizadas em <time dateTime="2026-11-14">14 de novembro de 2026</time>.</em>
          </p>

          <p><Link className="btn-primary" href="/reserva">Fazer pré-reserva gratuita</Link></p>
          <p>A pré-reserva é opcional e não substitui o cadastro oficial do benefício.</p>

          <h2>O que é o voucher de uniforme escolar de Jundiaí?</h2>
          <p>A Prefeitura de Jundiaí está preparando uma mudança no fornecimento de uniformes escolares para o ano letivo de 2027.</p>
          <p>
            O novo <strong>Programa Auxílio Uniforme</strong> prevê a disponibilização de um crédito eletrônico para que as famílias dos estudantes da rede municipal adquiram os uniformes diretamente em estabelecimentos credenciados.
          </p>
          <p>Em vez de receberem os kits por meio da distribuição centralizada da Prefeitura, os responsáveis poderão escolher onde adquirir os uniformes, respeitando as regras do programa.</p>
          <p>Segundo a Secretaria Municipal de Educação, a previsão é atender aproximadamente <strong>28.250 estudantes</strong>.</p>

          <h2>Quem terá direito ao voucher escolar em 2027?</h2>
          <p>De acordo com as informações divulgadas pela Prefeitura, o programa contempla estudantes matriculados nas seguintes etapas da rede municipal de Jundiaí:</p>
          <ul>
            <li>Educação Infantil II — crianças de 4 e 5 anos.</li>
            <li>Ensino Fundamental I — estudantes de aproximadamente 6 a 11 anos.</li>
          </ul>
          <p>A confirmação da elegibilidade individual e o acesso ao benefício seguirão os critérios e orientações oficiais da Prefeitura.</p>

          <h2>Como vai funcionar o voucher?</h2>
          <p>O programa prevê que os responsáveis recebam acesso a um crédito eletrônico por meio de aplicativo.</p>
          <p>Com esse crédito, poderão adquirir os uniformes escolares em estabelecimentos integrantes da rede credenciada do município.</p>
          <p>Uma das principais vantagens anunciadas é a possibilidade de escolher os tamanhos adequados para cada criança, reduzindo dificuldades com numeração e trocas.</p>

          <h2>Quando o voucher de Jundiaí será liberado?</h2>
          <p><strong>A data exata de liberação do crédito às famílias ainda não havia sido confirmada nas publicações oficiais consultadas até 14 de novembro de 2026.</strong></p>
          <p>A Secretaria Municipal de Educação está preparando as orientações para as escolas e os responsáveis.</p>
          <p>É importante acompanhar os comunicados oficiais da Prefeitura e da unidade escolar.</p>

          <h2>Qual aplicativo será utilizado?</h2>
          <p>A Prefeitura informou que o benefício será disponibilizado por aplicativo, mas as publicações oficiais consultadas ainda não confirmavam seu nome nem as instruções definitivas de acesso para os responsáveis.</p>
          <p>Assim que essas informações forem divulgadas, esta página poderá ser atualizada.</p>

          <h2>Qual é o valor do voucher de Jundiaí 2027?</h2>
          <p>As notícias oficiais listadas nas fontes desta página não informam o valor individual do crédito. Consulte os comunicados da Prefeitura e da escola para confirmar o valor e as regras aplicáveis à sua família.</p>

          <h2>Quais uniformes compõem o kit da Uniforme Jundiaí?</h2>
          <p>Na Uniforme Jundiaí, o kit escolar apresentado para 2027 possui seis peças:</p>
          <ul>
            <li>2 camisetas de manga curta.</li>
            <li>1 camiseta de manga longa.</li>
            <li>1 bermuda ou short-saia, conforme o kit escolhido.</li>
            <li>1 calça.</li>
            <li>1 blusa de frio.</li>
          </ul>
          <p>Veja as peças na <Link className="underline" href="/reserva">página de pré-reserva</Link> e consulte o <Link className="underline" href="/guia-de-tamanhos">guia de tamanhos dos uniformes</Link> antes de escolher. A composição acima descreve a oferta da Uniforme Jundiaí; a utilização do crédito segue as regras e especificações oficiais do programa.</p>

          <h2>Já é possível reservar os uniformes de 2027?</h2>
          <p><strong>Sim. A Uniforme Jundiaí oferece uma pré-reserva gratuita, sem compromisso de compra.</strong></p>
          <p>Você pode informar a escola, selecionar os tamanhos e registrar sua reserva antecipadamente.</p>
          <p>Não é necessário realizar pagamento para fazer a pré-reserva.</p>
          <p>A reserva não substitui o cadastro oficial do benefício e não garante a concessão ou a liberação do crédito pela Prefeitura.</p>

          <h3>Organize os uniformes antes da volta às aulas</h3>
          <p>Na Uniforme Jundiaí, você pode:</p>
          <ul>
            <li>Escolher os tamanhos das peças do kit.</li>
            <li>Fazer a pré-reserva sem pagamento imediato.</li>
            <li>Solicitar informações pelo WhatsApp.</li>
            <li>Receber avisos sobre a disponibilidade dos uniformes.</li>
          </ul>
          <p>
            <Link className="btn-primary" href="/reserva">FAZER PRÉ-RESERVA GRATUITA</Link>
          </p>

          <h2>Perguntas frequentes</h2>
          <h3>O voucher poderá ser utilizado em qualquer loja?</h3>
          <p>O crédito deverá ser utilizado nos estabelecimentos que integrarem a rede credenciada do município, conforme as regras oficiais.</p>
          <h3>A pré-reserva garante o recebimento do voucher?</h3>
          <p>Não. A pré-reserva é um serviço comercial da Uniforme Jundiaí. A concessão do benefício, o cadastro e a liberação do crédito dependem da Prefeitura, conforme as regras do programa.</p>
          <h3>É obrigatório fazer pré-reserva?</h3>
          <p>Não. A pré-reserva oferecida pela Uniforme Jundiaí é opcional e não faz parte das exigências da Prefeitura para concessão do benefício.</p>
          <h3>Preciso pagar para reservar?</h3>
          <p>Não. A pré-reserva oferecida pela Uniforme Jundiaí é gratuita e não obriga a família a comprar posteriormente.</p>
          <h3>Posso escolher tamanhos diferentes para cada peça?</h3>
          <p>Sim. Na pré-reserva da Uniforme Jundiaí, é possível selecionar os tamanhos das peças individualmente, respeitando a composição do kit.</p>
          <h3>Como saberei quando o voucher for liberado?</h3>
          <p>Acompanhe os comunicados da Prefeitura e as orientações da escola. Você também pode solicitar à Uniforme Jundiaí avisos relacionados à sua pré-reserva.</p>

          <p><Link className="btn-primary" href="/reserva">Escolher tamanhos e fazer pré-reserva gratuita</Link></p>

          <h2>Fontes oficiais</h2>
          <p>As informações sobre o programa foram consultadas nas publicações da Prefeitura de Jundiaí:</p>
          <ul>
            {FONTES.map((fonte) => (
              <li key={fonte.href}>
                <a className="underline" href={fonte.href}>{fonte.titulo}</a>
              </li>
            ))}
          </ul>

          <hr />
          <p>
            <strong>Sobre a Uniforme Jundiaí:</strong> somos uma empresa independente que comercializa uniformes escolares. Este site não pertence à Prefeitura de Jundiaí, à Secretaria Municipal de Educação ou às escolas municipais. As informações são disponibilizadas para orientação das famílias e podem ser atualizadas conforme novos comunicados oficiais.
          </p>
        </article>
      </main>
    </AppShell>
  );
}
