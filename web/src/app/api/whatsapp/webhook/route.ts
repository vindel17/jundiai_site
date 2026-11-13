import { NextResponse } from "next/server";
import { registrarEntregaVoucher } from "@/lib/reserva/aviso-voucher";
import { processarEntrada } from "@/lib/whatsapp/agente";
import { FalhaAoRegistrarEntrada } from "@/lib/whatsapp/atendimento";
import { assinaturaValida, respostaDeVerificacao } from "@/lib/whatsapp/assinatura";
import { extrairEntradas, extrairStatusEntrega } from "@/lib/whatsapp/tipos";

export const runtime = "nodejs";

/** Handshake do painel da Meta (Webhooks → Verify and save). */
export async function GET(request: Request) {
  const desafio = respostaDeVerificacao(new URL(request.url));
  if (!desafio) {
    return new NextResponse("Verificação inválida", { status: 403 });
  }
  return new NextResponse(desafio, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Mensagens recebidas.
 *
 * A Meta pode reenviar quando o registro da entrada falha. Depois que a
 * mensagem foi registrada, a idempotência evita repetir ações do bot.
 */
export async function POST(request: Request) {
  const corpo = await request.text();

  if (!assinaturaValida(corpo, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(corpo);
  } catch {
    return NextResponse.json({ recebido: true });
  }

  let falhouRegistro = false;
  for (const evento of extrairStatusEntrega(payload)) {
    try {
      await registrarEntregaVoucher(evento);
    } catch (erro) {
      falhouRegistro = true;
      console.error("Falha ao registrar entrega do aviso do voucher", { id: evento.id, erro });
    }
  }
  for (const entrada of extrairEntradas(payload)) {
    try {
      await processarEntrada(entrada);
    } catch (erro) {
      if (erro instanceof FalhaAoRegistrarEntrada) falhouRegistro = true;
      console.error("Falha ao processar mensagem do WhatsApp", {
        mensagemId: entrada.mensagemId,
        erro,
      });
    }
  }

  if (falhouRegistro) return NextResponse.json({ recebido: false }, { status: 503 });
  return NextResponse.json({ recebido: true });
}
