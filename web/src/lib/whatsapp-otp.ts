import { enviarMensagem } from "./whatsapp/graph";

/**
 * Envia o código de verificação pelo template de autenticação da Meta.
 * O template precisa ser categoria AUTHENTICATION com botão OTP `copy_code`,
 * que exige o mesmo código no corpo e no botão.
 */
export async function enviarCodigoWhatsApp(telefone: string, codigo: string) {
  const template = process.env.WHATSAPP_OTP_TEMPLATE ?? "codigo_acesso";
  const idioma = process.env.WHATSAPP_OTP_LOCALE ?? "pt_BR";

  return enviarMensagem({
    recipient_type: "individual",
    to: telefone.replace(/\D/g, ""),
    type: "template",
    template: {
      name: template,
      language: { code: idioma },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: codigo }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: codigo }],
        },
      ],
    },
  });
}
