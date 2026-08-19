/**
 * Compra no WhatsApp — híbrido: foto por link + pedido no site.
 * Sem checkout no chat (não há pagamento online ainda).
 */
import { CATALOGO, formatBRL, PROMO_HERO } from "@/data/catalogo";
import { enviarBotoes, enviarImagem, enviarTexto } from "../enviar";
import {
  detectarModelo,
  escolheuDoar,
  escolheuProcurar,
  ID,
  querMenu,
} from "../intencao";
import { mostrarMenu, responderDoarEmBreve } from "../menu";
import type { ResultadoTurno, Sessao } from "../sessao";
import { urlSite } from "../site";
import type { EntradaUsuario } from "../tipos";
import { iniciarProcuro } from "./procuro";

const FOTOS_NO_CHAT = 3;

function pecasComFoto() {
  return CATALOGO.filter((item) => item.image.endsWith(".jpg"));
}

function urlFotoCatalogo(caminho: string) {
  return urlSite(caminho);
}

export async function iniciarCompra(sessao: Sessao): Promise<ResultadoTurno> {
  const comFoto = pecasComFoto();
  const vitrine = comFoto.slice(0, FOTOS_NO_CHAT);
  const precoDe = formatBRL(PROMO_HERO.priceToCents);

  await enviarTexto(
    sessao.waId,
    [
      "Ótimo! 🛍️ Uniforme novo, preço de inauguração.",
      "",
      `A partir de ${precoDe} por peça — você escolhe só o que precisa.`,
      "Pedido e entrega fecham no site (ainda não tem pagamento aqui no Zap).",
    ].join("\n"),
  );

  for (const peca of vitrine) {
    await enviarImagem(
      sessao.waId,
      urlFotoCatalogo(peca.image),
      `${peca.name} · ${formatBRL(peca.priceCents)}`,
    );
  }

  const resto = CATALOGO.filter((item) => !vitrine.some((v) => v.id === item.id))
    .map((item) => `• ${item.name} · ${formatBRL(item.priceCents)}`)
    .join("\n");

  await enviarTexto(
    sessao.waId,
    ["As outras peças:", resto, "", "Montar o pedido:", urlSite("/comprar")].join(
      "\n",
    ),
    { preview: true },
  );

  await enviarBotoes(sessao.waId, "Como prefere seguir?", [
    { id: ID.compraSite, titulo: "Montar no site" },
    { id: ID.menuProcurar, titulo: "Procurar doação" },
    { id: "menu", titulo: "Menu" },
  ]);

  return { passo: "compra_vitrine", dados: {} };
}

export async function continuarCompra(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  const { escolha, texto } = entrada;

  if (querMenu(escolha, texto)) return mostrarMenu(sessao);
  if (escolheuDoar(escolha, texto)) return responderDoarEmBreve(sessao);
  if (escolheuProcurar(escolha, texto)) return iniciarProcuro(sessao);
  if (escolha === ID.compraSite) return enviarLinkCompra(sessao);

  const modelo = detectarModelo(escolha, texto);
  if (modelo) return mostrarPecaCatalogo(sessao, modelo);

  return iniciarCompra(sessao);
}

async function enviarLinkCompra(sessao: Sessao): Promise<ResultadoTurno> {
  await enviarTexto(
    sessao.waId,
    ["É por aqui que você monta tamanhos e quantidades:", urlSite("/comprar")].join(
      "\n",
    ),
    { preview: true },
  );
  return { passo: "compra_vitrine", dados: sessao.dados };
}

async function mostrarPecaCatalogo(
  sessao: Sessao,
  modeloId: string,
): Promise<ResultadoTurno> {
  const peca = CATALOGO.find((item) => item.id === modeloId);
  if (!peca) return iniciarCompra(sessao);

  const foto = peca.image.endsWith(".jpg") ? urlFotoCatalogo(peca.image) : null;
  const legenda = `${peca.name} · ${formatBRL(peca.priceCents)}\n${peca.hint}`;

  if (foto) {
    await enviarImagem(sessao.waId, foto, legenda);
  } else {
    await enviarTexto(sessao.waId, `${legenda}\n(foto em breve)`);
  }

  await enviarTexto(
    sessao.waId,
    ["Para pedir esta peça, monte no site:", urlSite("/comprar")].join("\n"),
    { preview: true },
  );

  return { passo: "compra_vitrine", dados: { modelo: modeloId } };
}
