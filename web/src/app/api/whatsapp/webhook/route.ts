import { NextResponse } from "next/server";
import { processarEntrada } from "@/lib/whatsapp/agente";
import { assinaturaValida, respostaDeVerificacao } from "@/lib/whatsapp/assinatura";
import { extrairEntradas } from "@/lib/whatsapp/tipos";

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
 * Depois da assinatura conferida, responde 200 sempre: a Meta reentrega em
 * qualquer outro código, e reprocessar por causa de um erro nosso viraria ação
 * duplicada. A idempotência real está em `agente_mensagem`.
 */
export async function POST(request: Request) {
  const corpo = await request.text();

  if (!assinaturaValida(corpo, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let entradas;
  try {
    entradas = extrairEntradas(JSON.parse(corpo));
  } catch {
    return NextResponse.json({ recebido: true });
  }

  for (const entrada of entradas) {
    try {
      await processarEntrada(entrada);
    } catch (erro) {
      console.error("Falha ao processar mensagem do WhatsApp", {
        mensagemId: entrada.mensagemId,
        erro,
      });
    }
  }

  return NextResponse.json({ recebido: true });
}
