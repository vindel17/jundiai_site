/** Ponto único de acesso à Cloud API da Meta (OTP e agente usam este módulo). */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0";

export function credenciais() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN são obrigatórios",
    );
  }

  return { phoneNumberId, token };
}

export function whatsappConfigurado(): boolean {
  return Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN,
  );
}

export async function enviarMensagem(payload: Record<string, unknown>) {
  const { phoneNumberId, token } = credenciais();

  const resposta = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    },
  );

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`WhatsApp Cloud API ${resposta.status}: ${detalhe}`);
  }

  return resposta.json();
}
