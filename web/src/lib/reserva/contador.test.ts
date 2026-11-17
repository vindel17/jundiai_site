import { describe, expect, it } from "vitest";
import { fraseContador, quantidadeDoCampo, totalPublico } from "./contador";

describe("contador público", () => {
  it("soma o sistema com o que foi lançado por fora e não desce de zero", () => {
    expect(totalPublico(40, 12)).toBe(52);
    expect(totalPublico(3, -10)).toBe(0);
    expect(totalPublico(Number.NaN, 4)).toBe(0);
  });

  it("começa a frase em 1 e muda o verbo no plural", () => {
    expect(fraseContador(0)).toBeNull();
    expect(fraseContador(1)).toEqual({ numero: "1", resto: "aluno já reservou o kit" });
    expect(fraseContador(1280)?.resto).toBe("alunos já reservaram o kit");
    expect(fraseContador(1280)?.numero).toBe((1280).toLocaleString("pt-BR"));
  });

  it("aceita inteiro com sinal e recusa vazio, zero e decimal", () => {
    expect(quantidadeDoCampo(" 15 ")).toBe(15);
    expect(quantidadeDoCampo("-3")).toBe(-3);
    expect(quantidadeDoCampo("+8")).toBe(8);
    expect(quantidadeDoCampo("0")).toBeNull();
    expect(quantidadeDoCampo("1.5")).toBeNull();
    expect(quantidadeDoCampo("dez")).toBeNull();
    expect(quantidadeDoCampo("10001")).toBeNull();
  });
});
