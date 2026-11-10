/**
 * Diagnóstico de ambiente no boot do servidor.
 *
 * Nenhuma dessas variáveis quebra o build quando falta: o site sobe, o deploy
 * fica verde e o problema só aparece quando um cliente clica num botão morto.
 * O log abaixo antecipa isso para o momento do deploy.
 */

import { siteUrl, siteUrlConfigurada, whatsappNumero } from "@/lib/config-publica";

type Checagem = {
  nome: string;
  ok: boolean;
  impacto: string;
};

function definida(valor: string | undefined) {
  return Boolean(valor?.trim());
}

function checagens(): Checagem[] {
  return [
    {
      nome: "NEXT_PUBLIC_WHATSAPP_NUMBER",
      ok: whatsappNumero() !== null,
      impacto: "ausente ou com número de exemplo — os CTAs de WhatsApp somem do site",
    },
    {
      nome: "NEXT_PUBLIC_SITE_URL",
      ok: siteUrlConfigurada(),
      impacto: `caindo no padrão ${siteUrl()} — links e fotos do agente podem apontar para o host errado`,
    },
    {
      nome: "NEXT_PUBLIC_SUPABASE_URL",
      ok: definida(process.env.NEXT_PUBLIC_SUPABASE_URL),
      impacto: "login, doação e conta ficam indisponíveis",
    },
    {
      nome: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ok:
        definida(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
        definida(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      impacto: "login, doação e conta ficam indisponíveis",
    },
    {
      nome: "SUPABASE_SERVICE_ROLE_KEY",
      ok: definida(process.env.SUPABASE_SERVICE_ROLE_KEY),
      impacto: "o agente do WhatsApp não consegue ler nem gravar dados",
    },
    {
      nome: "WHATSAPP_PHONE_NUMBER_ID",
      ok: definida(process.env.WHATSAPP_PHONE_NUMBER_ID),
      impacto: "nenhuma mensagem sai pela Cloud API (OTP e alertas)",
    },
    {
      nome: "WHATSAPP_ACCESS_TOKEN",
      ok: definida(process.env.WHATSAPP_ACCESS_TOKEN),
      impacto: "nenhuma mensagem sai pela Cloud API (OTP e alertas)",
    },
    {
      nome: "SEND_SMS_HOOK_SECRET",
      ok: definida(process.env.SEND_SMS_HOOK_SECRET),
      impacto: "o código de login não é entregue pelo WhatsApp",
    },
    {
      nome: "WHATSAPP_APP_SECRET",
      ok: definida(process.env.WHATSAPP_APP_SECRET),
      impacto: "o webhook do agente rejeita as mensagens recebidas",
    },
    {
      nome: "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
      ok: definida(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
      impacto: "a Meta não consegue validar o webhook do agente",
    },
    {
      nome: "WHATSAPP_ALERTA_TEMPLATE",
      ok: definida(process.env.WHATSAPP_ALERTA_TEMPLATE),
      impacto: "o aviso 'surgiu a peça' não chega a quem está na fila há mais de 24h",
    },
    {
      nome: "NEXT_PUBLIC_GA_ID",
      ok: definida(process.env.NEXT_PUBLIC_GA_ID),
      impacto: "sem Google Analytics: nenhuma conversão é medida",
    },
    {
      nome: "NEXT_PUBLIC_META_PIXEL_ID",
      ok: definida(process.env.NEXT_PUBLIC_META_PIXEL_ID),
      impacto: "sem Meta Pixel: campanhas ficam sem otimização",
    },
  ];
}

export function register() {
  const pendentes = checagens().filter((item) => !item.ok);
  if (pendentes.length === 0) return;

  const linhas = pendentes.map((item) => `  - ${item.nome}: ${item.impacto}`);
  console.warn(
    [
      `[config] ${pendentes.length} variável(is) de ambiente pendente(s):`,
      ...linhas,
    ].join("\n"),
  );
}
