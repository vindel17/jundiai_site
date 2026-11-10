import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { eEtapaDoNavegador } from "@/lib/metrica/etapas";
import {
  lerCookieOrigem,
  origemDoSite,
  temOrigem,
  textoCookieOrigem,
  type ParametrosOrigem,
} from "@/lib/metrica/origem-site";
import { registrarEtapas } from "@/lib/metrica/registrar";
import { ipDoCliente } from "@/lib/ip-cliente";
import { criarLimitador } from "@/lib/limite-taxa";

const COOKIE_VISITANTE = "uj_v";
const COOKIE_ORIGEM = "uj_o";
const MEIO_ANO = 180 * 24 * 60 * 60;
const ROBOS = /bot|crawl|spider|preview|facebookexternalhit|lighthouse|headless|monitor/i;
/** O corpo real tem uns 150 bytes; acima disso não é o nosso navegador. */
const CORPO_MAXIMO = 2048;

/**
 * Sem cookie, cada chamada vira um visitante novo. O limite por IP impede que um
 * script encha o funil. Folgado de propósito: escolas e redes móveis dividem o
 * mesmo IP, e contar a menos é melhor que barrar uma família.
 */
const limitePorIp = criarLimitador({ max: 60, janelaMs: 10 * 60 * 1000 });

function opcoesCookie(maxAge: number) {
  return {
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.slice(0, 80) : undefined;
}

function lerParametros(corpo: unknown): ParametrosOrigem {
  const bruto = (corpo as { origem?: Record<string, unknown> } | null)?.origem ?? {};
  return {
    origem: texto(bruto.origem),
    utmSource: texto(bruto.utmSource),
    utmMedium: texto(bruto.utmMedium),
    utmCampaign: texto(bruto.utmCampaign),
  };
}

/**
 * Acesso ao site, sem dado pessoal: um cookie anônimo vira um código no banco.
 * Responde 204 mesmo quando não grava (medir nunca atrapalha quem navega); só
 * passa de 60 chamadas em 10 minutos do mesmo IP recebe 429.
 */
export async function POST(request: NextRequest) {
  const vazio = new NextResponse(null, { status: 204 });
  if (ROBOS.test(request.headers.get("user-agent") ?? "")) return vazio;
  // O nosso navegador só chama a partir do próprio site.
  if (request.headers.get("sec-fetch-site") === "cross-site") return vazio;

  const ip = ipDoCliente(request.headers);
  if (ip && !limitePorIp.permitir(ip)) return new NextResponse(null, { status: 429 });

  let corpo: unknown;
  try {
    const texto = await request.text();
    if (texto.length > CORPO_MAXIMO) return vazio;
    corpo = JSON.parse(texto);
  } catch {
    return vazio;
  }
  const etapa = (corpo as { etapa?: unknown } | null)?.etapa;
  if (!eEtapaDoNavegador(etapa)) return vazio;

  const visitante = request.cookies.get(COOKIE_VISITANTE)?.value || randomUUID();
  const parametros = lerParametros(corpo);
  const chegouPorLink = temOrigem(parametros);
  const origem = chegouPorLink
    ? origemDoSite(parametros)
    : lerCookieOrigem(request.cookies.get(COOKIE_ORIGEM)?.value);

  const resposta = new NextResponse(null, { status: 204 });
  resposta.cookies.set(COOKIE_VISITANTE, visitante, opcoesCookie(MEIO_ANO));
  if (chegouPorLink) {
    resposta.cookies.set(COOKIE_ORIGEM, textoCookieOrigem(origem), opcoesCookie(MEIO_ANO));
  }

  await registrarEtapas({ canal: "site", pessoa: visitante, etapas: [etapa], origem });
  return resposta;
}
