import { formatBRL } from "@/data/catalogo";

/** Preferência da família. Não é compromisso: muda quando o voucher abrir. */
export const ENTREGAS = ["casa", "loja"] as const;

export type Entrega = (typeof ENTREGAS)[number];

/** Só o kit completo tem entrega grátis em casa. */
export const FRETE_KIT_INCOMPLETO_CENTAVOS = 1500;

export function eEntrega(valor: string): valor is Entrega {
  return (ENTREGAS as readonly string[]).includes(valor);
}

export function freteKitIncompleto() {
  return formatBRL(FRETE_KIT_INCOMPLETO_CENTAVOS);
}

export function regraDoFrete() {
  return `O kit completo tem entrega grátis em casa. Sem alguma peça, a entrega custa ${freteKitIncompleto()}.`;
}

export function rotuloEntrega(entrega: Entrega, completo: boolean) {
  if (entrega === "loja") return "Retirar na loja";
  return completo
    ? "Receber em casa, com entrega grátis"
    : `Receber em casa, com entrega de ${freteKitIncompleto()}`;
}
