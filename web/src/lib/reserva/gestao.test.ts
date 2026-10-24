import { describe, expect, it } from "vitest";
import { destinosDoLote, podeTransitar } from "./gestao";

describe("mudança de status por perfil", () => {
  it("administração cancela e reabre", () => {
    expect(podeTransitar(["admin"], "recebida", "cancelada")).toBe(true);
    expect(podeTransitar(["admin"], "cancelada", "recebida")).toBe(true);
    expect(destinosDoLote(["admin"])).toEqual([
      "recebida",
      "aceita",
      "em_producao",
      "kit_pronto",
      "cancelada",
    ]);
  });

  it("produção anda um passo e não cancela", () => {
    expect(podeTransitar(["producao"], "aceita", "em_producao")).toBe(true);
    expect(podeTransitar(["producao"], "em_producao", "aceita")).toBe(true);
    expect(podeTransitar(["producao"], "recebida", "kit_pronto")).toBe(false);
    expect(podeTransitar(["producao"], "aceita", "cancelada")).toBe(false);
    expect(podeTransitar(["producao"], "cancelada", "recebida")).toBe(false);
    expect(destinosDoLote(["producao"])).not.toContain("cancelada");
  });

  it("balcão não muda status", () => {
    expect(podeTransitar(["balcao"], "recebida", "aceita")).toBe(false);
    expect(destinosDoLote(["balcao"])).toEqual([]);
  });
});
