import { describe, expect, it } from "vitest";
import { ESCOLAS_VOUCHER } from "@/data/escolas";
import { calcularCobertura, formatarPercentual, lerOrdemCobertura } from "./cobertura";

const IVO = "Ivo de Bona EMEB";
const FLORISA = "Florisa Volpe Profa EMEB";

describe("cobertura por escola", () => {
  it("divide as reservas pelos alunos de cada escola", () => {
    const { escolas } = calcularCobertura({ [FLORISA]: 16, [IVO]: 116 });
    const florisa = escolas.find((linha) => linha.escola === FLORISA);
    const ivo = escolas.find((linha) => linha.escola === IVO);
    expect(florisa).toMatchObject({ alunos: 64, reservas: 16, percentual: 25 });
    expect(ivo?.reservas).toBe(116);
    expect(ivo?.percentual).toBeCloseTo(10.03, 1);
  });

  it("ordena do maior alcance para o menor e desempata pelo nome", () => {
    const { escolas } = calcularCobertura({ [FLORISA]: 16, [IVO]: 116 });
    expect(escolas[0].escola).toBe(FLORISA);
    expect(escolas[1].escola).toBe(IVO);
    expect(escolas[2].reservas).toBe(0);
  });

  it("ordena por reservas absolutas quando pedido", () => {
    const { escolas } = calcularCobertura({ [FLORISA]: 16, [IVO]: 116 }, "reservas");
    expect(escolas[0].escola).toBe(IVO);
  });

  it("soma o geral só com as escolas da lista e separa as de fora", () => {
    const cobertura = calcularCobertura({ [IVO]: 10, "Escola antiga EMEB": 3 });
    expect(cobertura.totalReservas).toBe(10);
    expect(cobertura.foraDaLista).toBe(3);
    expect(cobertura.totalAlunos).toBe(ESCOLAS_VOUCHER.reduce((s, e) => s + e.alunos, 0));
    expect(cobertura.escolasSemReserva).toBe(ESCOLAS_VOUCHER.length - 1);
  });

  it("sem reservas, tudo zera sem dividir por zero", () => {
    const cobertura = calcularCobertura({});
    expect(cobertura.percentualGeral).toBe(0);
    expect(cobertura.escolas.every((linha) => linha.percentual === 0)).toBe(true);
  });

  it("aceita só as ordens conhecidas", () => {
    expect(lerOrdemCobertura("alunos")).toBe("alunos");
    expect(lerOrdemCobertura("qualquer")).toBe("percentual");
    expect(lerOrdemCobertura(undefined)).toBe("percentual");
  });

  it("mostra uma casa decimal em português", () => {
    expect(formatarPercentual(12.345)).toBe("12,3%");
    expect(formatarPercentual(0)).toBe("0,0%");
  });
});
