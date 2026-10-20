import { enviarLista, enviarTexto } from "./enviar";
import { ID } from "./intencao";
import type { ResultadoTurno, Sessao } from "./sessao";
import { urlSite } from "./site";

export async function mostrarMenu(sessao: Sessao): Promise<ResultadoTurno> {
  const saudacao = sessao.passo === "inicio" ? "Olá! 😊\n\n" : "";
  await enviarLista(
    sessao.waId,
    `${saudacao}Como posso te ajudar hoje?`,
    "Ver opções",
    [
      {
        id: ID.menuReservar,
        titulo: "Reservar uniforme",
        descricao: "Escolher tamanhos, sem pagar agora",
      },
      {
        id: ID.menuComprar,
        titulo: "Comprar",
        descricao: "Escolher a peça, ver a foto e ir ao site",
      },
      {
        id: ID.menuProcurar,
        titulo: "Procurar doação",
        descricao: "Achar uma peça ou entrar na lista de espera",
      },
      {
        id: ID.menuDoar,
        titulo: "Doar",
        descricao: "Anunciar uma peça que não serve mais",
      },
      {
        id: ID.menuBeneficios,
        titulo: "Meus benefícios",
        descricao: "Doações concluídas, indicação e camisetas",
      },
    ],
  );
  return { passo: "menu", dados: {} };
}

export async function responderDoarEmBreve(
  sessao: Sessao,
): Promise<ResultadoTurno> {
  await enviarTexto(
    sessao.waId,
    [
      "Doar pelo WhatsApp chega já na próxima etapa. ♻️",
      "",
      "Por enquanto você anuncia com foto no site — e a peça aparece no feed na hora:",
      urlSite("/doacao/doar"),
      "",
      "Quando alguém pedir, você vai poder aceitar por aqui.",
    ].join("\n"),
    { preview: true },
  );
  return mostrarMenu(sessao);
}
