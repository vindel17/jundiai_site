import Link from "next/link";
import { SiteFooter } from "@/components/site-chrome";
import { SiteTopbar } from "@/components/site-topbar";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidade",
};

export default function PrivacidadePage() {
  return (
    <>
      <SiteTopbar />
      <main id="conteudo" tabIndex={-1} className="section-block">
        <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
          <p className="eyebrow">LGPD</p>
          <h1 className="section-title">Política de privacidade</h1>
          <p className="section-lead">
            Esta política descreve como a operação {SITE.name} ({SITE.brandLine})
            trata dados pessoais coletados neste site.
          </p>

          <h2>1. Controlador</h2>
          <p>
            Os dados são tratados pela Espaço Livre Uniformes, no contexto da
            operação escolar {SITE.name}, domínio {SITE.domain}.
          </p>

          <h2>2. Dados coletados</h2>
          <p>
            Na solicitação de etiquetas, podemos coletar: nome do responsável,
            WhatsApp, e-mail (opcional), endereço de entrega, nome ou iniciais do
            aluno, escola, turma (opcional), e parâmetros de origem de campanha
            (UTM / QR Code).
          </p>

          <h2>3. Finalidades</h2>
          <ul>
            <li>Produzir e enviar o kit de etiquetas</li>
            <li>Comunicar status do pedido pelo WhatsApp</li>
            <li>Analisar demanda por escola e região</li>
            <li>Melhorar o atendimento e futuras campanhas</li>
          </ul>

          <h2>4. Bases legais</h2>
          <p>
            Tratamos os dados com base na execução de solicitação do titular
            (entrega do brinde) e, quando aplicável, no consentimento para
            comunicações.
          </p>

          <h2>5. Compartilhamento</h2>
          <p>
            Podemos compartilhar dados com prestadores essenciais (hospedagem,
            planilha de CRM, Correios/transportadora e ferramentas de mensagens),
            apenas para cumprir as finalidades acima.
          </p>

          <h2>6. Retenção</h2>
          <p>
            Mantemos os dados pelo tempo necessário à operação do brinde, ao
            relacionamento comercial legítimo e a obrigações legais.
          </p>

          <h2>7. Direitos do titular</h2>
          <p>
            Você pode solicitar acesso, correção, exclusão ou oposição ao
            tratamento pelo WhatsApp da operação, identificado neste site.
          </p>

          <h2>8. Esclarecimento institucional</h2>
          <p>
            {SITE.name} é uma iniciativa da Espaço Livre Uniformes e{" "}
            <strong>não</strong> é um canal oficial da Prefeitura de {SITE.city},
            da Secretaria de Educação ou das escolas municipais.
          </p>

          <p className="mt-10">
            <Link href="/etiquetas" className="underline underline-offset-2">
              Voltar para a solicitação de etiquetas
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
