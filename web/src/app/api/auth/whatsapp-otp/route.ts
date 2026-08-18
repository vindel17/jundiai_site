import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { enviarCodigoWhatsApp } from "@/lib/whatsapp-otp";

export const runtime = "nodejs";

type PayloadHook = {
  user: { phone: string };
  sms: { otp: string };
};

/**
 * Send SMS Hook do Supabase Auth.
 * O Supabase gera e valida o código; aqui só entregamos pelo WhatsApp.
 * Configurar em Authentication → Hooks → Send SMS (HTTPS) apontando para esta rota.
 */
export async function POST(request: Request) {
  const segredo = process.env.SEND_SMS_HOOK_SECRET;

  if (!segredo) {
    console.error("SEND_SMS_HOOK_SECRET não configurado");
    return NextResponse.json({ error: "Hook não configurado" }, { status: 500 });
  }

  const corpo = await request.text();
  const headers = Object.fromEntries(request.headers);

  let payload: PayloadHook;
  try {
    const webhook = new Webhook(segredo.replace("v1,whsec_", ""));
    payload = webhook.verify(corpo, headers) as PayloadHook;
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  try {
    await enviarCodigoWhatsApp(payload.user.phone, payload.sms.otp);
  } catch (erro) {
    console.error("Falha ao enviar OTP pelo WhatsApp", erro);
    // O Supabase mostra esta mensagem ao usuário final.
    return NextResponse.json(
      {
        error: {
          http_code: 502,
          message: "Não conseguimos enviar o código agora. Tente de novo em instantes.",
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({});
}
