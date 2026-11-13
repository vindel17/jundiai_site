import { describe, expect, it } from "vitest";
import { gradeDaPeca } from "@/lib/reserva/medidas";
import { sugerirTamanho } from "@/lib/reserva/sugestao";
import { formaIlustrativa } from "../camiseta";
import type { Ponto } from "../glb";
import { RECEITA_CAMISETA } from "./camiseta";
import { fotografarCena, type Cena, type Foto } from "./cena-teste";
import { homografia, type Quadrilatero } from "./homografia";
import { encaixarCartao, medirPeca } from "./medir";
import { pecaCamiseta } from "./pecas-teste";
import type { Medidas } from "./receita";

/** Camiseta tamanho 10 da grade. */
const REAL = { largura: 41, comprimento: 57 };
const PECA = pecaCamiseta(formaIlustrativa(REAL));
const medirCamiseta = (foto: Foto) => medirPeca(foto.imagem, RECEITA_CAMISETA);

/**
 * Erro aceito, em cm. O comprimento sai sempre um pouco menor: a limpeza
 * da máscara arredonda a ponta do ombro junto à gola.
 */
const ERRO_LARGURA = 0.5;
const ERRO_COMPRIMENTO = 0.8;

function medir(cena: Omit<Cena, "peca"> = {}) {
  const foto = fotografarCena({ peca: PECA, ...cena });
  const medicao = medirCamiseta(foto);
  if ("erro" in medicao) throw new Error(medicao.erro);
  return { foto, medicao };
}

/** A grade da camiseta vem como [comprimento, largura]. */
function esperarMedidas({ valores: [comprimento, largura] }: Medidas) {
  expect(Math.abs(largura - REAL.largura)).toBeLessThan(ERRO_LARGURA);
  expect(Math.abs(comprimento - REAL.comprimento)).toBeLessThan(ERRO_COMPRIMENTO);
}

/** Maior distância, em pixels, entre um canto verdadeiro e o canto achado mais perto dele. */
function erroDosCantos(foto: Foto, achado: Quadrilatero): number {
  const distancia = (a: Ponto, b: Ponto) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  return Math.max(...foto.cartao!.map((real) => Math.min(...achado.map((c) => distancia(real, c)))));
}

describe("homografia", () => {
  it("leva cada canto ao seu destino e acerta os pontos do meio", () => {
    const origem: Quadrilatero = [[1210, 880], [1630, 905], [1602, 1170], [1195, 1120]];
    const destino: Quadrilatero = [[0, 0], [8.56, 0], [8.56, 5.398], [0, 5.398]];
    const h = homografia(origem, destino)!;
    origem.forEach((p, i) => {
      expect(h(p)[0]).toBeCloseTo(destino[i][0], 9);
      expect(h(p)[1]).toBeCloseTo(destino[i][1], 9);
    });
    // Reta continua reta: o cruzamento das diagonais da foto cai no meio do cartão.
    const [[ax, ay], [bx, by], [cx, cy], [dx, dy]] = origem;
    const t = ((bx - ax) * (dy - by) - (by - ay) * (dx - bx)) / ((cx - ax) * (dy - by) - (cy - ay) * (dx - bx));
    const centro = h([ax + t * (cx - ax), ay + t * (cy - ay)]);
    expect(centro[0]).toBeCloseTo(4.28, 9);
    expect(centro[1]).toBeCloseTo(2.699, 9);
  });

  it("recusa cantos alinhados", () => {
    expect(homografia([[0, 0], [1, 1], [2, 2], [3, 3]], [[0, 0], [1, 0], [1, 1], [0, 1]])).toBeNull();
  });
});

describe("medidas da camiseta", () => {
  it("desfaz a inclinação da câmera quando os pontos são exatos", () => {
    const { pontos, cartao } = fotografarCena({
      peca: PECA,
      largura: 40,
      altura: 30,
      inclinacao: 20,
      direcao: 40,
      giroDaPeca: 7,
      cartao: { giro: 25, centro: [3, -2] },
    });
    const medidas = RECEITA_CAMISETA.medir(pontos, cartao!)!;
    expect(medidas.valores[0]).toBeCloseTo(REAL.comprimento, 6);
    expect(medidas.valores[1]).toBeCloseTo(REAL.largura, 6);
    expect(medidas.cartaoDoCentro).toBeCloseTo(Math.hypot(3, 2), 6);
  });
});

describe("medirPeca com a camiseta", () => {
  it("mede a camiseta fotografada de cima", () => {
    const { foto, medicao } = medir();
    esperarMedidas(medicao);
    expect(erroDosCantos(foto, medicao.cartaoFoto)).toBeLessThan(0.3);
    expect(medicao.avisos).toEqual([]);
  });

  it("corrige a foto inclinada, com o cartão torto", () => {
    const { foto, medicao } = medir({ inclinacao: 8, direcao: 30, cartao: { giro: 20 } });
    esperarMedidas(medicao);
    expect(erroDosCantos(foto, medicao.cartaoFoto)).toBeLessThan(0.3);
  });

  it("aguenta bastante inclinação, com o cartão em pé", () => {
    esperarMedidas(medir({ inclinacao: 15, direcao: 200, cartao: { giro: 70 } }).medicao);
  });

  it("aguenta o granulado e a luz desigual de uma foto", () => {
    const cena = { inclinacao: 5, direcao: 120, cartao: { giro: 10 } };
    esperarMedidas(medir({ ...cena, ruido: 25 }).medicao);
    esperarMedidas(medir({ ...cena, sombra: 0.15 }).medicao);
  });

  it("acha o cartão da cor do fundo e o cartão escuro em camiseta clara", () => {
    esperarMedidas(medir({ inclinacao: 6, direcao: 300, cartao: { cor: [235, 235, 230], giro: 15 } }).medicao);
    esperarMedidas(
      medir({ tecido: [230, 230, 225], fundo: [50, 45, 40], cartao: { cor: [20, 60, 40], giro: 90 } }).medicao,
    );
  });

  it("não confunde a tarja do verso do cartão com a borda", () => {
    const { foto, medicao } = medir({
      tecido: [230, 230, 225],
      fundo: [120, 90, 60],
      cartao: { cor: [190, 190, 185], tarja: [25, 25, 25], giro: 5 },
      inclinacao: 5,
      direcao: 100,
    });
    esperarMedidas(medicao);
    expect(erroDosCantos(foto, medicao.cartaoFoto)).toBeLessThan(0.3);
  });

  it("mede a foto um pouco desfocada e recusa a muito desfocada", () => {
    const cena: Omit<Cena, "peca"> = {
      ruido: 10,
      inclinacao: 8,
      direcao: 30,
      cartao: { cor: [225, 225, 220], tarja: [25, 25, 25], giro: 20 },
    };
    const { foto, medicao } = medir({ ...cena, desfoque: 3 });
    esperarMedidas(medicao);
    expect(erroDosCantos(foto, medicao.cartaoFoto)).toBeLessThan(0.4);

    const borrada = medirCamiseta(fotografarCena({ peca: PECA, ...cena, desfoque: 5 }));
    expect(borrada).toHaveProperty("erro");
    expect((borrada as { erro: string }).erro).toContain("foco");
  });

  it("mede a camiseta um pouco torta na mesa", () => {
    esperarMedidas(medir({ giroDaPeca: 5, inclinacao: 6, direcao: 45, cartao: { giro: 40 } }).medicao);
  });

  it("mede a camiseta de manga longa", () => {
    const foto = fotografarCena({
      peca: pecaCamiseta(formaIlustrativa(REAL), 38),
      largura: 2400,
      altura: 1400,
      inclinacao: 8,
      direcao: 30,
      cartao: { giro: 20 },
    });
    const medicao = medirCamiseta(foto);
    if ("erro" in medicao) throw new Error(medicao.erro);
    esperarMedidas(medicao);
  });

  it("avisa quando o cartão está longe do meio da camiseta", () => {
    const { medicao } = medir({ inclinacao: 8, direcao: 90, cartao: { centro: [0, 14] } });
    expect(medicao.cartaoDoCentro).toBeGreaterThan(12);
    expect(medicao.avisos).toHaveLength(1);
    expect(medicao.avisos[0]).toContain("centro");
  });

  it("leva os cantos marcados com o dedo para as bordas do cartão", () => {
    const foto = fotografarCena({ peca: PECA, inclinacao: 8, direcao: 30, ruido: 10, cartao: { giro: 20 } });
    const desvios = [[16, -12], [-18, 10], [14, 17], [-11, -19]];
    const marcado = foto.cartao!.map(([x, y], i): Ponto => [x + desvios[i][0], y + desvios[i][1]]) as Quadrilatero;
    expect(erroDosCantos(foto, encaixarCartao(foto.imagem, marcado)!)).toBeLessThan(0.3);

    const longe = foto.cartao!.map(([x, y]): Ponto => [x + 300, y]) as Quadrilatero;
    expect(encaixarCartao(foto.imagem, longe)).toBeNull();
  });

  it("explica quando não há cartão ou ele some no tecido", () => {
    const semCartao = medirCamiseta(fotografarCena({ peca: PECA, cartao: null }));
    expect(semCartao).toHaveProperty("erro");
    // A camiseta achada segue junto, para a pessoa só marcar o cartão.
    expect(semCartao).toHaveProperty("pontosFoto");
    const mesmaCor = medirCamiseta(fotografarCena({ peca: PECA, cartao: { cor: [35, 50, 115] } }));
    expect(mesmaCor).toHaveProperty("erro");
  });

  it("da foto ao tamanho sugerido", () => {
    const { medicao } = medir({ inclinacao: 8, direcao: 30, ruido: 12, cartao: { giro: 20 } });
    const grade = gradeDaPeca("camiseta-manga-curta")!;
    expect(sugerirTamanho(grade, medicao.valores).tamanho).toBe("10");
  });
});
