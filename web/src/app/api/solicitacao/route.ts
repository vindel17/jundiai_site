import { NextResponse } from "next/server";
import { appendSolicitacao } from "@/lib/sheets";
import { solicitacaoSchema, totalEtiquetas } from "@/lib/validation";

const recentSubmissions = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

function clientKey(request: Request, whatsapp: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${forwarded ?? "local"}:${whatsapp}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body?.honeypot === "string" && body.honeypot.length > 0) {
      return NextResponse.json({ ok: true, totalEtiquetas: 0, filhos: 0 });
    }

    const parsed = solicitacaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Dados inválidos",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const key = clientKey(request, parsed.data.whatsapp);
    const last = recentSubmissions.get(key);
    const now = Date.now();
    if (last && now - last < RATE_LIMIT_MS) {
      return NextResponse.json(
        { ok: false, error: "Aguarde um momento antes de enviar novamente." },
        { status: 429 },
      );
    }
    recentSubmissions.set(key, now);

    await appendSolicitacao(parsed.data);

    return NextResponse.json({
      ok: true,
      totalEtiquetas: totalEtiquetas(parsed.data.filhos.length),
      filhos: parsed.data.filhos.length,
    });
  } catch (error) {
    console.error("[api/solicitacao]", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível registrar a solicitação." },
      { status: 500 },
    );
  }
}
