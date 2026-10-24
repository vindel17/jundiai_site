import { reservaAberta } from "./kit";

/** Espelho de `reserva_status_chk` e de `mudar_status_reserva` (migração 0010). */
export const STATUS_RESERVA = [
  "recebida",
  "aceita",
  "em_producao",
  "kit_pronto",
  "cancelada",
] as const;

export type StatusReserva = (typeof STATUS_RESERVA)[number];

const ROTULOS: Record<StatusReserva, string> = {
  recebida: "Recebida",
  aceita: "Aceita",
  em_producao: "Em produção",
  kit_pronto: "Kit pronto",
  cancelada: "Cancelada",
};

/** Um passo para a frente, um para trás (correção da equipe) e cancelar. */
const TRANSICOES: Record<StatusReserva, readonly StatusReserva[]> = {
  recebida: ["aceita", "cancelada"],
  aceita: ["em_producao", "recebida", "cancelada"],
  em_producao: ["kit_pronto", "aceita", "cancelada"],
  kit_pronto: ["em_producao", "cancelada"],
  cancelada: ["recebida"],
};

/** O banco trava o tamanho fora destes status (`travar_tamanho_reserva`). */
export const STATUS_EDITAVEIS: readonly StatusReserva[] = ["recebida", "aceita"];

export function eStatusReserva(valor: string): valor is StatusReserva {
  return (STATUS_RESERVA as readonly string[]).includes(valor);
}

export function rotuloStatus(status: StatusReserva) {
  return ROTULOS[status];
}

export function proximosStatus(status: StatusReserva) {
  return TRANSICOES[status];
}

export function podeMudarStatus(de: StatusReserva, para: StatusReserva) {
  return TRANSICOES[de].includes(para);
}

export function statusEditavel(status: StatusReserva) {
  return STATUS_EDITAVEIS.includes(status);
}

/** Tamanho e entrega mudam até 31/12 e enquanto a reserva não entrou em produção. */
export function reservaEditavel(status: StatusReserva, agora = new Date()) {
  return reservaAberta(agora) && statusEditavel(status);
}
