import { enviarMensagem } from "./graph";

function para(numero: string) {
  return numero.replace(/\D/g, "");
}

/**
 * Texto livre — só vale dentro da janela de 24h desde a última mensagem do
 * usuário. Fora dela a Meta exige template aprovado (ver `whatsapp-agente.md` §6).
 */
export async function enviarTexto(
  destino: string,
  texto: string,
  opcoes?: { preview?: boolean },
) {
  return enviarMensagem({
    recipient_type: "individual",
    to: para(destino),
    type: "text",
    text: { preview_url: Boolean(opcoes?.preview), body: texto },
  });
}

export type Botao = { id: string; titulo: string };

/** Até 3 botões por mensagem — limite da Meta. */
export async function enviarBotoes(
  destino: string,
  texto: string,
  botoes: Botao[],
) {
  return enviarMensagem({
    recipient_type: "individual",
    to: para(destino),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: texto },
      action: {
        buttons: botoes.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.titulo.slice(0, 20) },
        })),
      },
    },
  });
}

export type ItemLista = { id: string; titulo: string; descricao?: string };

/** Até 10 linhas. O botão abre a lista — título no máximo 20 caracteres. */
export async function enviarLista(
  destino: string,
  texto: string,
  botao: string,
  itens: ItemLista[],
) {
  return enviarMensagem({
    recipient_type: "individual",
    to: para(destino),
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: texto },
      action: {
        button: botao.slice(0, 20),
        sections: [
          {
            rows: itens.slice(0, 10).map((item) => ({
              id: item.id.slice(0, 200),
              title: item.titulo.slice(0, 24),
              ...(item.descricao
                ? { description: item.descricao.slice(0, 72) }
                : {}),
            })),
          },
        ],
      },
    },
  });
}

export async function enviarImagem(
  destino: string,
  url: string,
  legenda?: string,
) {
  return enviarMensagem({
    recipient_type: "individual",
    to: para(destino),
    type: "image",
    image: { link: url, ...(legenda ? { caption: legenda } : {}) },
  });
}

export async function enviarTemplate(
  destino: string,
  nome: string,
  parametros: string[],
) {
  const idioma = process.env.WHATSAPP_OTP_LOCALE ?? "pt_BR";
  return enviarMensagem({
    recipient_type: "individual",
    to: para(destino),
    type: "template",
    template: {
      name: nome,
      language: { code: idioma },
      components:
        parametros.length === 0
          ? []
          : [
              {
                type: "body",
                parameters: parametros.map((texto) => ({
                  type: "text",
                  text: texto,
                })),
              },
            ],
    },
  });
}
