import { pode, type PerfilEquipe } from "./equipe";
import { podeMudarStatus, STATUS_RESERVA, type StatusReserva } from "./status";

/** Cancelar e reabrir ficam com a administração. O restante pede a permissão de status. */
export function podeTransitar(
  perfis: readonly PerfilEquipe[],
  de: StatusReserva,
  para: StatusReserva,
) {
  if (!podeMudarStatus(de, para)) return false;
  const cancela = de === "cancelada" || para === "cancelada";
  return pode(perfis, cancela ? "cancelar" : "status");
}

/** Status que aparecem na ação em lote: algum passo permitido chega neles. */
export function destinosDoLote(perfis: readonly PerfilEquipe[]) {
  return STATUS_RESERVA.filter((para) =>
    STATUS_RESERVA.some((de) => podeTransitar(perfis, de, para)),
  );
}
