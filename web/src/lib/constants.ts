import { DOMINIO_PADRAO, whatsappFormatado, whatsappNumero } from "./config-publica";

export const SITE = {
  name: "Uniforme Jundiaí",
  brandLine: "Uniformes escolares da rede municipal de Jundiaí",
  credenciamento: "Empresa credenciada para o voucher do uniforme escolar",
  city: "Jundiaí",
  state: "SP",
  domain: DOMINIO_PADRAO,
  prazoEstimado: "até 15 dias úteis após a confirmação",
} as const;

/** Texto padrão de quem chega pelos CTAs de ajuda, sem contexto de funil. */
export const MENSAGEM_AJUDA = `Olá! Quero ajuda com o uniforme escolar em ${SITE.city}.`;

export function getWhatsAppUrl(message?: string) {
  const phone = whatsappNumero();
  if (!phone) return "#";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message ?? MENSAGEM_AJUDA)}`;
}

export function getWhatsAppDisplay() {
  return whatsappFormatado();
}
