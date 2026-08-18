import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Valida o `X-Hub-Signature-256` do webhook da Meta.
 *
 * A rota é pública, então sem esta checagem qualquer um poderia publicar
 * anúncio ou confirmar doação em nome de outra pessoa.
 */
export function assinaturaValida(corpoBruto: string, cabecalho: string | null) {
  const segredo = process.env.WHATSAPP_APP_SECRET;
  if (!segredo || !cabecalho?.startsWith("sha256=")) return false;

  const recebida = Buffer.from(cabecalho.slice("sha256=".length), "hex");
  const esperada = createHmac("sha256", segredo).update(corpoBruto).digest();

  if (recebida.length !== esperada.length) return false;
  return timingSafeEqual(recebida, esperada);
}

/** Handshake de verificação do webhook (GET com hub.challenge). */
export function respostaDeVerificacao(url: URL): string | null {
  const token = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!token) return null;

  const modo = url.searchParams.get("hub.mode");
  const enviado = url.searchParams.get("hub.verify_token");
  const desafio = url.searchParams.get("hub.challenge");

  if (modo !== "subscribe" || enviado !== token || !desafio) return null;
  return desafio;
}
