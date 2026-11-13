import { describe, expect, it } from "vitest";
import { reservaDoTelefone, reservasAtivas, statusDaLista, type ReservaLinha } from "./consultas";

describe("reserva da família", () => {
  it("reconhece o mesmo celular com e sem o nono dígito", () => {
    expect(reservaDoTelefone("5511999998888", "+5511999998888")).toBe(true);
    expect(reservaDoTelefone("5511999998888", "551199998888")).toBe(true);
    expect(reservaDoTelefone("5511999998888", "5511988887777")).toBe(false);
  });

  it("esconde a reserva cancelada da página da família", () => {
    const linhas = [{ status: "recebida" }, { status: "cancelada" }] as ReservaLinha[];
    expect(reservasAtivas(linhas).map((linha) => linha.status)).toEqual(["recebida"]);
  });

  it("esconde canceladas na lista da equipe, salvo filtro explícito", () => {
    expect(statusDaLista(undefined)).toBe("ativas");
    expect(statusDaLista("")).toBe("ativas");
    expect(statusDaLista("aceita")).toBe("aceita");
    expect(statusDaLista("cancelada")).toBe("cancelada");
    expect(statusDaLista("todas")).toBe("todas");
  });
});
