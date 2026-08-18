/**
 * Avisa quem cadastrou `procuro` quando um anúncio compatível entra no feed.
 *
 * Disparado pelo comando `publicarAnuncio` — site e WhatsApp passam pelo mesmo
 * ponto, então o alerta não depende de quem publicou.
 *
 * Fora da janela de 24h a Meta só aceita template aprovado. Sem template
 * configurado, o aviso fica para a próxima mensagem da pessoa.
 */

import { nomeDoModelo } from "@/lib/doacao/modelos";
import {
  adminConfigurado,
  createSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { enviarBotoes, enviarTemplate } from "./enviar";
import { whatsappConfigurado } from "./graph";
import { ID } from "./intencao";
import { urlFeedDoacao } from "./site";

const TETO = 20;
const JANELA_MS = 24 * 60 * 60 * 1000;

export type AnuncioAlerta = {
  id: string;
  perfil_id: string;
  modelo_id: string;
  tamanho: string;
};

type Destino = {
  perfilId: string;
  procuroId: string;
  telefone: string;
  waId: string | null;
  ultimaEntrada: string | null;
};

export async function avisarQuemProcura(anuncio: AnuncioAlerta) {
  if (!adminConfigurado() || !whatsappConfigurado()) return;

  const destinos = await listarDestinos(anuncio);
  if (destinos.length === 0) return;

  const peca = nomeDoModelo(anuncio.modelo_id);
  const link = urlFeedDoacao({
    modelo: anuncio.modelo_id,
    tamanho: anuncio.tamanho,
  });
  const agora = Date.now();
  const avisados: string[] = [];

  await Promise.allSettled(
    destinos.map(async (destino) => {
      const ok = await enviarUm(destino, peca, anuncio.tamanho, link, agora);
      if (ok) avisados.push(destino.procuroId);
    }),
  );

  if (avisados.length === 0) return;

  const db = createSupabaseAdminClient();
  await db
    .from("procuro")
    .update({ avisado_em: new Date().toISOString() })
    .in("id", avisados);
}

async function listarDestinos(anuncio: AnuncioAlerta): Promise<Destino[]> {
  const db = createSupabaseAdminClient();
  const { data: filas } = await db
    .from("procuro")
    .select("id, perfil_id")
    .eq("ativo", true)
    .eq("modelo_id", anuncio.modelo_id)
    .eq("tamanho", anuncio.tamanho)
    .neq("perfil_id", anuncio.perfil_id)
    .limit(TETO);

  if (!filas?.length) return [];

  const ids = filas.map((f) => f.perfil_id as string);
  const [{ data: perfis }, { data: conversas }] = await Promise.all([
    db.from("perfil").select("id, telefone").in("id", ids),
    db
      .from("agente_conversa")
      .select("wa_id, perfil_id, ultima_entrada_em")
      .in("perfil_id", ids),
  ]);

  const telefonePorPerfil = new Map(
    (perfis ?? []).map((p) => [p.id as string, String(p.telefone ?? "")]),
  );
  const conversaPorPerfil = new Map(
    (conversas ?? []).map((c) => [
      c.perfil_id as string,
      {
        waId: String(c.wa_id),
        ultimaEntrada: (c.ultima_entrada_em as string | null) ?? null,
      },
    ]),
  );

  return filas.flatMap((fila) => {
    const perfilId = fila.perfil_id as string;
    const telefone = telefonePorPerfil.get(perfilId) ?? "";
    const conversa = conversaPorPerfil.get(perfilId);
    if (!telefone && !conversa?.waId) return [];
    return [
      {
        perfilId,
        procuroId: fila.id as string,
        telefone,
        waId: conversa?.waId ?? null,
        ultimaEntrada: conversa?.ultimaEntrada ?? null,
      },
    ];
  });
}

async function enviarUm(
  destino: Destino,
  peca: string,
  tamanho: string,
  link: string,
  agora: number,
): Promise<boolean> {
  const para = destino.waId ?? destino.telefone.replace(/\D/g, "");
  if (!para) return false;

  const naJanela =
    Boolean(destino.ultimaEntrada) &&
    agora - new Date(destino.ultimaEntrada as string).getTime() < JANELA_MS;

  try {
    if (naJanela) {
      await enviarBotoes(
        para,
        `Boa notícia! 🎉\n\nEntrou uma ${peca.toLowerCase()} tamanho ${tamanho} na Rede Circular.\n\n${link}`,
        [
          { id: ID.verTodas, titulo: "Ver no site" },
          { id: ID.menuProcurar, titulo: "Procurar aqui" },
        ],
      );
      return true;
    }

    const template = process.env.WHATSAPP_ALERTA_TEMPLATE;
    if (!template) {
      console.warn(
        "Procuro compatível fora da janela 24h e WHATSAPP_ALERTA_TEMPLATE vazio; aviso não enviado.",
        destino.perfilId,
      );
      return false;
    }

    await enviarTemplate(para, template, [peca, tamanho]);
    return true;
  } catch (erro) {
    console.error("Falha ao avisar quem procura", destino.perfilId, erro);
    return false;
  }
}
