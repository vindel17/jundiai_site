import { SITE } from "@/lib/constants";
import { enviarLista } from "./enviar";
import { ID } from "./intencao";
import type { ResultadoTurno, Sessao } from "./sessao";

export async function mostrarMenu(sessao: Sessao): Promise<ResultadoTurno> {
  const saudacao =
    sessao.passo === "inicio"
      ? `Olá! Aqui é a ${SITE.name}.\n\n`
      : "";
  await enviarLista(
    sessao.waId,
    `${saudacao}Escolha uma opção.`,
    "Ver opções",
    [
      {
        id: ID.menuReservar,
        titulo: "Reservar uniforme",
        descricao: "Escolher tamanhos, sem pagar agora",
      },
      {
        id: ID.menuMinhasReservas,
        titulo: "Minhas reservas",
        descricao: "Ver e ajustar o que você reservou",
      },
      {
        id: ID.menuComprar,
        titulo: "Comprar",
        descricao: "Escolher a peça, ver a foto e ir ao site",
      },
      {
        id: ID.menuBeneficios,
        titulo: "Meus benefícios",
        descricao: "Indicação e camisetas",
      },
      {
        id: ID.menuAtendente,
        titulo: "Falar com atendente",
        descricao: "Pedir ajuda à equipe da loja",
      },
    ],
  );
  return { passo: "menu", dados: {} };
}
