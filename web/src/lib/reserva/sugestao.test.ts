import { describe, expect, it } from "vitest";
import { gradeDaPeca } from "./medidas";
import { sugerirTamanho } from "./sugestao";

/** A grade da camiseta vem como [comprimento, largura]. */
const GRADE = gradeDaPeca("camiseta-manga-curta")!;

describe("sugerirTamanho", () => {
  it("devolve o tamanho que bate com a peça medida", () => {
    expect(sugerirTamanho(GRADE, [57, 41])).toEqual({ tamanho: "10", folga: [0, 0] });
  });

  it("não sobe de tamanho por um erro pequeno da medição", () => {
    expect(sugerirTamanho(GRADE, [57.8, 41.6]).tamanho).toBe("10");
  });

  it("entre dois tamanhos, sugere o maior", () => {
    expect(sugerirTamanho(GRADE, [58.5, 41]).tamanho).toBe("12");
    expect(sugerirTamanho(GRADE, [53, 42.5])).toEqual({ tamanho: "12", folga: [8, 0.5] });
  });

  it("peça menor que a grade leva o menor tamanho", () => {
    expect(sugerirTamanho(GRADE, [30, 20]).tamanho).toBe("4");
  });

  it("não sugere nada para peça maior que o maior tamanho", () => {
    expect(sugerirTamanho(GRADE, [80, 60])).toEqual({ tamanho: null, folga: null });
  });

  it("a tolerância pode ser tirada", () => {
    expect(sugerirTamanho(GRADE, [57.2, 41], 0).tamanho).toBe("12");
  });
});
