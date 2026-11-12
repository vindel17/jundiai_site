import { describe, expect, it } from "vitest";
import { origemDaReservaSite } from "@/lib/reserva/origem";
import {
  faltamParaProximaCamiseta,
  passoDoTrio,
  pecasExtrasPorIndicacao,
  textoPremioIndicacao,
} from "./regras";

describe("peças extras da indicação", () => {
  it("não premia antes de 3 pessoas", () => {
    expect(pecasExtrasPorIndicacao(0)).toBe(0);
    expect(pecasExtrasPorIndicacao(2)).toBe(0);
  });

  it("dá uma peça a cada 3, sem parar em uma", () => {
    expect(pecasExtrasPorIndicacao(3)).toBe(1);
    expect(pecasExtrasPorIndicacao(5)).toBe(1);
    expect(pecasExtrasPorIndicacao(6)).toBe(2);
    expect(pecasExtrasPorIndicacao(9)).toBe(3);
  });

  it("explica a regra no texto do link", () => {
    expect(textoPremioIndicacao()).toBe(
      "A cada 3 famílias que reservarem por este link e comprarem o kit, você ganha uma camiseta extra.",
    );
  });

  it("leva o convite para a reserva feita pelo site", () => {
    expect(origemDaReservaSite("abcd1234")).toEqual({
      canal: "indicacao",
      codigo: "abcd1234",
      texto: "Reserva pelo site",
    });
    expect(origemDaReservaSite("")).toEqual({
      canal: "direto",
      codigo: "site",
      texto: "Reserva pelo site",
    });
  });

  it("mostra quantas famílias faltam para a próxima camiseta", () => {
    expect(faltamParaProximaCamiseta(0)).toBe(3);
    expect(faltamParaProximaCamiseta(1)).toBe(2);
    expect(faltamParaProximaCamiseta(2)).toBe(1);
    expect(faltamParaProximaCamiseta(3)).toBe(3);
    expect(passoDoTrio(0)).toBe(0);
    expect(passoDoTrio(2)).toBe(2);
    expect(passoDoTrio(3)).toBe(3);
    expect(passoDoTrio(4)).toBe(1);
  });
});
