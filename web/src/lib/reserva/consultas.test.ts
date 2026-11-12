import { describe, expect, it } from "vitest";
import { reservaDoTelefone, reservasAtivas, type ReservaLinha } from "./consultas";

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
});