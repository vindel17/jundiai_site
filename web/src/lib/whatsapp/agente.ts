/**
 * Ponto de entrada do agente.
 *
 * Identifica o número, guarda o estado e despacha o turno. A regra de negócio
 * continua em `lib/comandos/*` — daqui só sai conversa.
 */

import { lerOrigem, origemDireta } from "@/lib/reserva/origem";
import { carregarConversa, mensagemNova, salvarConversa } from "./conversa";
import { mostrarBeneficios } from "./fluxos/beneficios";
import { continuarCompra, iniciarCompra } from "./fluxos/compra";
import { continuarMinhasReservas, iniciarMinhasReservas } from "./fluxos/minhas-reservas";
import { continuarProcuro, iniciarProcuro } from "./fluxos/procuro";
import { continuarReserva, iniciarReserva } from "./fluxos/reserva";
import { manterRascunho } from "./fluxos/reserva-estado";
import { perfilPorWaId } from "./identidade";
import {
  detectarModelo,
  escolheuBeneficios,
  escolheuComprar,
  escolheuDoar,
  escolheuMinhasReservas,
  escolheuProcurar,
  escolheuReservar,
  querMenu,
} from "./intencao";
import { mostrarMenu, responderDoarEmBreve } from "./menu";
import type { ResultadoTurno, Sessao } from "./sessao";
import type { EntradaUsuario } from "./tipos";

export async function processarEntrada(entrada: EntradaUsuario) {
  if (!(await mensagemNova(entrada.mensagemId, entrada.waId))) return;

  const gravada = await carregarConversa(entrada.waId);
  const sessao: Sessao = {
    waId: entrada.waId,
    perfilId: gravada.perfilId ?? (await perfilPorWaId(entrada.waId)),
    passo: gravada.passo,
    dados: gravada.dados,
  };

  const turno = manterRascunho(sessao, await despachar(sessao, entrada));
  await salvarConversa(entrada.waId, {
    perfilId: turno.perfilId !== undefined ? turno.perfilId : sessao.perfilId,
    passo: turno.passo,
    dados: turno.dados,
  });
}

async function despachar(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  const { escolha, texto } = entrada;

  if (querMenu(escolha, texto)) return mostrarMenu(sessao);

  if (escolheuMinhasReservas(escolha, texto) && !sessao.passo.startsWith("reserva_")) {
    return iniciarMinhasReservas(sessao);
  }
  if (sessao.passo.startsWith("minhas_")) return continuarMinhasReservas(sessao, entrada);

  if (
    escolheuReservar(escolha, texto) &&
    !sessao.passo.startsWith("reserva_")
  ) {
    return iniciarReserva(sessao, lerOrigem(texto) ?? origemDireta());
  }

  if (sessao.passo.startsWith("reserva_")) {
    return continuarReserva(sessao, entrada);
  }

  const origem = lerOrigem(texto);
  if (origem && (sessao.passo === "inicio" || sessao.passo === "menu")) {
    return iniciarReserva(sessao, origem);
  }

  if (sessao.passo.startsWith("procuro_")) {
    return continuarProcuro(sessao, entrada);
  }

  if (sessao.passo.startsWith("compra_")) {
    return continuarCompra(sessao, entrada);
  }

  if (escolheuDoar(escolha, texto)) return responderDoarEmBreve(sessao);
  if (escolheuProcurar(escolha, texto)) return iniciarProcuro(sessao);
  if (escolheuComprar(escolha, texto)) {
    return iniciarCompra(sessao, detectarModelo(escolha, texto));
  }
  if (escolheuBeneficios(escolha, texto)) return mostrarBeneficios(sessao);

  const modelo = detectarModelo(escolha, texto);
  if (modelo) return iniciarProcuro(sessao, modelo);

  return mostrarMenu(sessao);
}
