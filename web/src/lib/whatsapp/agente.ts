/**
 * Ponto de entrada do agente.
 *
 * Identifica o número, guarda o estado e despacha o turno. A regra de negócio
 * continua em `lib/comandos/*` — daqui só sai conversa.
 */

import { etapasDoTurno } from "@/lib/metrica/etapas";
import { registrarEtapas } from "@/lib/metrica/registrar";
import { lerOrigem, origemDireta } from "@/lib/reserva/origem";
import { gravarPreferenciaVoucher } from "@/lib/reserva/aviso-voucher";
import { listarReservasDoTelefone, reservasAtivas } from "@/lib/reserva/consultas";
import { FalhaAoRegistrarEntrada, registrarEntrada } from "./atendimento";
import { carregarConversa, salvarConversa } from "./conversa";
import { enviarTexto } from "./enviar";
import { mostrarBeneficios } from "./fluxos/beneficios";
import { continuarCompra, iniciarCompra } from "./fluxos/compra";
import { continuarMinhasReservas, iniciarMinhasReservas } from "./fluxos/minhas-reservas";
import { continuarReserva, iniciarReserva } from "./fluxos/reserva";
import { manterRascunho, origemDosDados } from "./fluxos/reserva-estado";
import { perfilPorWaId } from "./identidade";
import {
  detectarModelo,
  escolheuBeneficios,
  escolheuComprar,
  escolheuMinhasReservas,
  escolheuReservar,
  pediuAtendente,
  querMenu,
} from "./intencao";
import { mostrarMenu } from "./menu";
import type { ResultadoTurno, Sessao } from "./sessao";
import type { EntradaUsuario } from "./tipos";

export async function processarEntrada(entrada: EntradaUsuario) {
  const comando = entrada.tipo === "texto" ? entrada.texto.trim().toUpperCase() : "";
  const pediuAviso = /^QUERO O AVISO[.!]?$/.test(comando);
  const pediuParar = /^PARAR[.!]?$/.test(comando);
  let respostaAviso: string | null = null;
  if (pediuAviso || pediuParar) {
    try {
      if (pediuAviso && reservasAtivas((await listarReservasDoTelefone(entrada.waId)).linhas).length === 0) {
        respostaAviso = "Faça sua pré-reserva primeiro. No menu, toque em *Reservar uniforme*.";
      } else {
        const aceita = await gravarPreferenciaVoucher(entrada.waId, pediuAviso, "whatsapp", entrada.enviadaEm);
        respostaAviso = aceita
          ? "Combinado! Vamos avisar por aqui quando o voucher liberar. Para cancelar o aviso, mande *PARAR*."
          : "O aviso do voucher está desativado. Para voltar a receber, mande *QUERO O AVISO*.";
      }
    } catch (erro) {
      throw new FalhaAoRegistrarEntrada("Não consegui registrar a preferência do voucher.", { cause: erro });
    }
  }
  const rota = await registrarEntrada(entrada, pediuAtendente(entrada.escolha, entrada.texto));
  if (respostaAviso) {
    if (rota !== "duplicada") await enviarTexto(entrada.waId, respostaAviso);
    return;
  }
  if (rota === "novo") {
    await enviarTexto(
      entrada.waId,
      "Sua conversa entrou na fila da equipe. Pode deixar sua dúvida por aqui. Se você estava reservando, suas escolhas continuam salvas.",
    );
  }
  if (rota !== "bot") return;

  const gravada = await carregarConversa(entrada.waId);
  const sessao: Sessao = {
    waId: entrada.waId,
    perfilId: gravada.perfilId ?? (await perfilPorWaId(entrada.waId)),
    passo: gravada.passo,
    dados: gravada.dados,
  };

  const turno = manterRascunho(sessao, await despachar(sessao, entrada));
  void registrarEtapas({
    canal: "whatsapp",
    pessoa: entrada.waId,
    etapas: etapasDoTurno(turno.passo, turno.dados),
    origem: turno.passo.startsWith("reserva_")
      ? origemDosDados(turno.dados)
      : (lerOrigem(entrada.texto) ?? origemDireta()),
  });
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

  if (sessao.passo.startsWith("compra_")) {
    return continuarCompra(sessao, entrada);
  }

  if (escolheuComprar(escolha, texto)) {
    return iniciarCompra(sessao, detectarModelo(escolha, texto));
  }
  if (escolheuBeneficios(escolha, texto)) return mostrarBeneficios(sessao);

  const modelo = detectarModelo(escolha, texto);
  if (modelo) return iniciarCompra(sessao, modelo);

  return mostrarMenu(sessao);
}
