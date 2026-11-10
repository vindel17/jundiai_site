import { describe, expect, it } from "vitest";
import { ipDoCliente } from "./ip-cliente";
import { criarLimitador } from "./limite-taxa";

describe("criarLimitador", () => {
  it("aceita até o máximo e recusa o excedente na mesma janela", () => {
    const limite = criarLimitador({ max: 3, janelaMs: 1000 });
    expect([1, 2, 3, 4, 5].map(() => limite.permitir("a", 0))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it("abre uma janela nova depois do prazo", () => {
    const limite = criarLimitador({ max: 1, janelaMs: 1000 });
    expect(limite.permitir("a", 0)).toBe(true);
    expect(limite.permitir("a", 999)).toBe(false);
    expect(limite.permitir("a", 1000)).toBe(true);
  });

  it("conta cada chave separadamente", () => {
    const limite = criarLimitador({ max: 1, janelaMs: 1000 });
    expect(limite.permitir("a", 0)).toBe(true);
    expect(limite.permitir("a", 1)).toBe(false);
    expect(limite.permitir("b", 1)).toBe(true);
  });

  it("não guarda mais chaves que o teto, descartando a mais antiga", () => {
    const limite = criarLimitador({ max: 1, janelaMs: 1000, maxChaves: 2 });
    limite.permitir("a", 0);
    limite.permitir("b", 1);
    limite.permitir("c", 2);
    // "a" foi descartada: volta a ser aceita em vez de seguir contada.
    expect(limite.permitir("a", 3)).toBe(true);
    // "c" continua guardada e já usou o seu limite.
    expect(limite.permitir("c", 4)).toBe(false);
  });

  it("limpa as janelas vencidas antes de descartar as vivas", () => {
    const limite = criarLimitador({ max: 1, janelaMs: 1000, maxChaves: 2 });
    limite.permitir("a", 0);
    limite.permitir("b", 500);
    // "a" venceu em 1000; ao entrar "c" ela sai e "b" (viva) é preservada.
    limite.permitir("c", 1000);
    expect(limite.permitir("b", 1001)).toBe(false);
  });
});

describe("ipDoCliente", () => {
  it("usa o cabeçalho do Cloudflare", () => {
    const cabecalhos = new Headers({ "cf-connecting-ip": " 203.0.113.9 " });
    expect(ipDoCliente(cabecalhos)).toBe("203.0.113.9");
  });

  it("ignora o X-Forwarded-For, que o cliente pode forjar", () => {
    const cabecalhos = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(ipDoCliente(cabecalhos)).toBeNull();
  });

  it("devolve null quando não há cabeçalho", () => {
    expect(ipDoCliente(new Headers())).toBeNull();
  });
});
