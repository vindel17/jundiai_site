/**
 * Configuração pública lida do ambiente.
 *
 * Cada `process.env.NEXT_PUBLIC_*` precisa aparecer por extenso: é assim que o
 * Next substitui o valor no bundle do navegador.
 *
 * O princípio aqui é tratar valor inválido como valor ausente. Uma variável
 * errada não quebra o build e o sintoma só aparece quando um cliente clica —
 * foi assim que o número de exemplo do `.env.example` chegou a produção.
 */

/** Domínio final da operação. Usado nos textos legais e como último recurso. */
export const DOMINIO_PADRAO = "uniformejundiai.com.br";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const GA = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function preenchido(valor: string | undefined) {
  const limpo = valor?.trim();
  return limpo ? limpo : null;
}

/** Números de exemplo repetem o mesmo dígito depois do DDD (99999-9999). */
function ehNumeroDeExemplo(digitos: string) {
  return new Set(digitos.slice(4)).size === 1;
}

/**
 * Número de atendimento em E.164 sem "+", ou `null` quando não dá para confiar.
 *
 * Devolver `null` esconde os CTAs de WhatsApp. É pior mandar a família para um
 * contato inexistente do que não oferecer o canal naquela tela.
 */
export function whatsappNumero(): string | null {
  const digitos = preenchido(WHATSAPP)?.replace(/\D/g, "");
  if (!digitos) return null;

  const completo = digitos.length <= 11 ? `55${digitos}` : digitos;
  if (!/^55\d{10,11}$/.test(completo)) return null;
  if (ehNumeroDeExemplo(completo)) return null;
  return completo;
}

/** `(11) 98765-4321` para exibir na UI, ou string vazia se não houver número. */
export function whatsappFormatado(): string {
  const phone = whatsappNumero();
  if (!phone) return "";
  const ddd = phone.slice(2, 4);
  const inicio = phone.slice(4, -4);
  const fim = phone.slice(-4);
  return `(${ddd}) ${inicio}-${fim}`;
}

/**
 * Origem pública do site, sem barra final.
 *
 * `host` vem dos headers e só existe durante uma requisição; o agente do
 * WhatsApp monta links fora desse contexto e depende de `NEXT_PUBLIC_SITE_URL`.
 */
export function siteUrl(host?: string | null, proto?: string | null): string {
  const env = preenchido(SITE_URL)?.replace(/\/+$/, "");
  if (env) return /^https?:\/\//.test(env) ? env : `https://${env}`;
  if (host) return `${proto || "https"}://${host}`;
  return `https://${DOMINIO_PADRAO}`;
}

/** `true` quando a origem veio do ambiente, e não de um palpite. */
export function siteUrlConfigurada() {
  return preenchido(SITE_URL) !== null;
}

export const GA_ID = preenchido(GA);
export const META_PIXEL_ID = preenchido(PIXEL);
