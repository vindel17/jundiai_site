import { describe, expect, it } from "vitest";
import { formaIlustrativa } from "../camiseta";
import type { Forma } from "../forma";
import type { Ponto } from "../glb";
import type { Imagem } from "./mascara";
import { moldeDaFoto } from "./molde";

const PX_POR_CM = 6;
const AZUL: [number, number, number] = [30, 45, 110];
const BRANCO: [number, number, number] = [235, 235, 230];

type Foto = { angulo?: number; margem?: number; peca?: number[]; fundo?: number[]; ruido?: number };

/** Sorteio repetível, para o teste dar sempre o mesmo resultado. */
function sorteio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function contornoCompleto({ metade }: Forma): Ponto[] {
  return [...metade, ...metade.slice(1, -1).reverse().map(([x, z]): Ponto => [-x, z])];
}

function dentro([x, y]: Ponto, poligono: Ponto[]): boolean {
  let resultado = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i];
    const [xj, yj] = poligono[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) resultado = !resultado;
  }
  return resultado;
}

/** Desenha a camiseta, em pixels, como numa foto tirada de cima. */
function fotografar(
  forma: Forma,
  { angulo = 0, margem = 40, peca = AZUL, fundo = BRANCO, ruido = 0 }: Foto = {},
): Imagem {
  const aleatorio = sorteio(7);
  const a = (angulo * Math.PI) / 180;
  const pontos = contornoCompleto(forma).map(([x, z]): Ponto => [
    (x * Math.cos(a) - z * Math.sin(a)) * PX_POR_CM,
    (x * Math.sin(a) + z * Math.cos(a)) * PX_POR_CM,
  ]);
  const x0 = Math.min(...pontos.map((p) => p[0])) - margem;
  const y0 = Math.min(...pontos.map((p) => p[1])) - margem;
  const largura = Math.ceil(Math.max(...pontos.map((p) => p[0])) - x0 + margem);
  const altura = Math.ceil(Math.max(...pontos.map((p) => p[1])) - y0 + margem);
  const dados = new Uint8ClampedArray(largura * altura * 4);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const cor = dentro([x + x0 + 0.5, y + y0 + 0.5], pontos) ? peca : fundo;
      const variacao = (aleatorio() * 2 - 1) * ruido;
      dados.set([...cor.map((c) => c + variacao), 255], (y * largura + x) * 4);
    }
  }
  return { largura, altura, dados };
}

const REAL = formaIlustrativa({ largura: 54, comprimento: 69 });
const MEDIDAS = { largura: REAL.largura, comprimento: REAL.comprimento };

function moldeOk(imagem: Imagem, medidas = MEDIDAS) {
  const resultado = moldeDaFoto(imagem, medidas);
  if ("erro" in resultado) throw new Error(resultado.erro);
  return resultado;
}

describe("moldeDaFoto", () => {
  it("recupera o contorno de uma camiseta de frente", () => {
    const { forma, divergencia } = moldeOk(fotografar(REAL));
    expect(divergencia).toBeLessThan(0.02);
    expect(forma.metade[0][0]).toBe(0);
    expect(forma.metade[forma.metade.length - 1]).toEqual([0, 69]);
    expect(forma.alturaCava).toBeCloseTo(REAL.alturaCava, 0);
    expect(Math.abs(forma.larguraGola - REAL.larguraGola)).toBeLessThan(1.5);
    expect(Math.abs(forma.profundidadeGola - REAL.profundidadeGola)).toBeLessThan(1);

    const pontaManga = Math.max(...forma.metade.map((p) => p[0]));
    const pontaReal = Math.max(...REAL.metade.map((p) => p[0]));
    expect(Math.abs(pontaManga - pontaReal)).toBeLessThan(1);
  });

  it("deixa o contorno simples, sem os pixels da foto", () => {
    const { forma } = moldeOk(fotografar(REAL));
    expect(forma.metade.length).toBeLessThan(40);
  });

  it("endireita a peça fotografada um pouco torta", () => {
    const { forma, divergencia } = moldeOk(fotografar(REAL, { angulo: 6 }));
    expect(divergencia).toBeLessThan(0.03);
    expect(forma.alturaCava).toBeCloseTo(REAL.alturaCava, 0);
  });

  it("aguenta o granulado e a variação de luz de uma foto", () => {
    const { forma, divergencia } = moldeOk(fotografar(REAL, { ruido: 40 }));
    expect(divergencia).toBeLessThan(0.02);
    expect(forma.alturaCava).toBeCloseTo(REAL.alturaCava, 0);
    expect(forma.metade.length).toBeLessThan(40);
  });

  it("funciona com camiseta clara em fundo escuro", () => {
    const { forma } = moldeOk(fotografar(REAL, { peca: BRANCO, fundo: [40, 40, 40] }));
    expect(forma.alturaCava).toBeCloseTo(REAL.alturaCava, 0);
  });

  it("avisa quando as medidas não batem com a proporção da foto", () => {
    const { divergencia } = moldeOk(fotografar(REAL), { largura: 54, comprimento: 80 });
    expect(divergencia).toBeGreaterThan(0.1);
  });

  it("recusa a foto em que a peça encosta na borda", () => {
    const resultado = moldeDaFoto(fotografar(REAL, { margem: 0 }), MEDIDAS);
    expect(resultado).toHaveProperty("erro");
  });
});
