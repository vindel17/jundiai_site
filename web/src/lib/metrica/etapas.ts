/** Etapas do funil. Espelho de `metrica_etapa_chk` (migração 0012). */

export const CANAIS_METRICA = ["whatsapp", "site"] as const;

export type CanalMetrica = (typeof CANAIS_METRICA)[number];

export type EtapaWhatsApp =
  | "contato"
  | "reserva_iniciada"
  | "escola"
  | "kit"
  | "resumo"
  | "confirmada";

export type EtapaSite = "visita_site" | "visita_reserva" | "clique_whatsapp" | "confirmada";

/** O navegador só pode registrar estas. A confirmação do site sai do servidor. */
export const ETAPAS_DO_NAVEGADOR = ["visita_site", "visita_reserva", "clique_whatsapp"] as const;

export type EtapaDoNavegador = (typeof ETAPAS_DO_NAVEGADOR)[number];

export function eEtapaDoNavegador(valor: unknown): valor is EtapaDoNavegador {
  return (ETAPAS_DO_NAVEGADOR as readonly unknown[]).includes(valor);
}

/** Cada etapa do funil, na ordem em que a pessoa avança. */
export const FUNIL: Record<CanalMetrica, readonly { etapa: string; rotulo: string }[]> = {
  whatsapp: [
    { etapa: "contato", rotulo: "Chamaram no WhatsApp" },
    { etapa: "reserva_iniciada", rotulo: "Começaram a reservar" },
    { etapa: "escola", rotulo: "Escolheram a escola" },
    { etapa: "kit", rotulo: "Escolheram o kit" },
    { etapa: "resumo", rotulo: "Chegaram ao resumo" },
    { etapa: "confirmada", rotulo: "Confirmaram a reserva" },
  ],
  site: [
    { etapa: "visita_site", rotulo: "Visitaram o site" },
    { etapa: "visita_reserva", rotulo: "Abriram a página de reserva" },
    { etapa: "confirmada", rotulo: "Confirmaram a reserva" },
  ],
};

/** Mostradas ao lado do funil, fora da sequência. */
export const EXTRAS: Record<CanalMetrica, readonly { etapa: string; rotulo: string }[]> = {
  whatsapp: [],
  site: [{ etapa: "clique_whatsapp", rotulo: "Clicaram para falar no WhatsApp" }],
};

type Dados = Record<string, unknown>;

function preenchido(dados: Dados, chave: string) {
  const valor = dados[chave];
  return typeof valor === "string" && valor.trim().length > 0;
}

/**
 * Etapas que a conversa já alcançou, vistas pelo passo e pelos dados do turno.
 * Quem chega longe passa por todas as anteriores, então elas vêm juntas: o
 * banco ignora a repetição e o funil nunca fica com um degrau faltando.
 */
export function etapasDoTurno(passo: string, dados: Dados): EtapaWhatsApp[] {
  const etapas: EtapaWhatsApp[] = ["contato"];
  if (!passo.startsWith("reserva_")) return etapas;

  etapas.push("reserva_iniciada");
  const confirmou = passo === "reserva_outro" || passo === "reserva_outra_escola";
  const noResumo = confirmou || passo === "reserva_confirma";

  if (confirmou || preenchido(dados, "escola")) etapas.push("escola");
  if (confirmou || preenchido(dados, "kit")) etapas.push("kit");
  if (noResumo) etapas.push("resumo");
  if (confirmou) etapas.push("confirmada");
  return etapas;
}
