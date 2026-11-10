import { describe, expect, it } from "vitest";
import { pecasExtrasPorIndicacao, textoPremioIndicacao } from "./regras";

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
      "A cada 3 pessoas que reservarem o kit por esse link e comprarem, você ganha uma peça extra.",
    );
  });
});
