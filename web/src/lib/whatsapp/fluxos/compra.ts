/**
 * Compra no WhatsApp — híbrido: escolhe a peça, vê a foto, monta no site.
 * Sem checkout no chat (não há pagamento online ainda).
 */
import { CATALOGO, formatBRL, PROMO_HERO } from "@/data/catalogo";
import { enviarBotoes, enviarImagem, enviarLista, enviarTexto } from "../enviar";
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

function urlFotoCatalogo(caminho: string) {
  return urlSite(caminho);
}

export async function iniciarCompra(
  sessao: Sessao,
  modelo?: string | null,
): Promise<ResultadoTurno> {
  if (modelo) return mostrarPecaCatalogo(sessao, modelo);

  const precoDe = formatBRL(PROMO_HERO.priceToCents);
  await enviarLista(
    sessao.waId,
    [
      "Ótimo! 🛍️ Qual peça você quer ver?",
      "",
      `A partir de ${precoDe} por peça. Pedido e entrega fecham no site.`,
    ].join("\n"),
    "Escolher peça",
    [
      ...CATALOGO.map((item) => ({
        id: `${ID.pecaPrefixo}${item.id}`,
        titulo: item.name,
        descricao: `${formatBRL(item.priceCents)} · ${item.hint}`,
      })),
      {
        id: ID.compraSite,
        titulo: "Montar kit no site",
        descricao: "Várias peças e tamanhos de uma vez",
      },
    ],
  );
  return { passo: "compra_peca", dados: {} };
}

export async function continuarCompra(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  const { escolha, texto } = entrada;

  if (querMenu(escolha, texto)) return mostrarMenu(sessao);
  if (escolheuDoar(escolha, texto)) return responderDoarEmBreve(sessao);
  if (escolheuProcurar(escolha, texto)) return iniciarProcuro(sessao);
  if (escolha === ID.compraOutra) return iniciarCompra(sessao);
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
  return { passo: "compra_peca", dados: sessao.dados };
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

  await enviarBotoes(sessao.waId, "Como prefere seguir?", [
    { id: ID.compraSite, titulo: "Montar no site" },
    { id: ID.compraOutra, titulo: "Outra peça" },
    { id: ID.menuProcurar, titulo: "Procurar doação" },
  ]);

  return { passo: "compra_vitrine", dados: { modelo: modeloId } };
}
