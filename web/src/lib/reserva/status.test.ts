import { describe, expect, it } from "vitest";
import { podeMudarStatus, reservaEditavel, STATUS_RESERVA } from "./status";

const ANTES_DO_PRAZO = new Date("2026-10-20T12:00:00-03:00");
const DEPOIS_DO_PRAZO = new Date("2027-01-02T12:00:00-03:00");

describe("status da reserva", () => {
  it("segue recebida, aceita, em produção e kit pronto, um passo por vez", () => {
    expect(podeMudarStatus("recebida", "aceita")).toBe(true);
    expect(podeMudarStatus("aceita", "em_producao")).toBe(true);
    expect(podeMudarStatus("em_producao", "kit_pronto")).toBe(true);
    expect(podeMudarStatus("recebida", "kit_pronto")).toBe(false);
  });

  it("cancela de qualquer status e só reabre como recebida", () => {
    for (const status of STATUS_RESERVA) {
      if (status === "cancelada") continue;
      expect(podeMudarStatus(status, "cancelada")).toBe(true);
    }
    expect(podeMudarStatus("cancelada", "recebida")).toBe(true);
    expect(podeMudarStatus("cancelada", "aceita")).toBe(false);
  });

  it("trava o tamanho na produção, mesmo antes de 31/12", () => {
    expect(reservaEditavel("recebida", ANTES_DO_PRAZO)).toBe(true);
    expect(reservaEditavel("aceita", ANTES_DO_PRAZO)).toBe(true);
    expect(reservaEditavel("em_producao", ANTES_DO_PRAZO)).toBe(false);
    expect(reservaEditavel("cancelada", ANTES_DO_PRAZO)).toBe(false);
  });

  it("trava tudo depois de 31/12", () => {
    expect(reservaEditavel("recebida", DEPOIS_DO_PRAZO)).toBe(false);
  });
});
