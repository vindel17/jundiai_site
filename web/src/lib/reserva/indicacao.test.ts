import { describe, expect, it } from "vitest";
import { resumirIndicados } from "./indicacao";

describe("placar de quem reservou pelo link", () => {
  it("conta uma família uma vez e ignora a própria conta", () => {
    const placar = resumirIndicados(
      [
        { telefone: "5511999998888", criadoEm: "2026-11-01T12:00:00Z" },
        { telefone: "551199998888", criadoEm: "2026-11-10T12:00:00Z" },
        { telefone: "5511988887777", criadoEm: "2026-11-12T12:00:00Z" },
      ],
      "5511999998888",
    );

    expect(placar.familias).toBe(1);
    expect(placar.ultimaEm).toBe("2026-11-12T12:00:00Z");
  });
});