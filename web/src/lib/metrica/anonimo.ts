import { createHmac } from "node:crypto";

/**
 * Segredo que só o servidor conhece. `METRICA_SALT` é opcional: sem ele usamos
 * o segredo do webhook, que já existe onde o WhatsApp funciona. Sem nenhum dos
 * dois (desenvolvimento, testes) o funil não grava nada.
 */
export function segredoDaMetrica() {
  return process.env.METRICA_SALT?.trim() || process.env.WHATSAPP_APP_SECRET?.trim() || "";
}

/** Telefone ou cookie vira um código que não volta ao original. */
export function pseudonimo(pessoa: string, segredo: string) {
  return createHmac("sha256", segredo).update(pessoa.trim()).digest("hex").slice(0, 32);
}
