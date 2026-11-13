import { describe, expect, it } from "vitest";
import { gradeDaPeca } from "@/lib/reserva/medidas";
import { sugerirTamanho } from "@/lib/reserva/sugestao";
import type { Ponto } from "../glb";
import { fotografarCena, type Cena } from "./cena-teste";
import { RECEITA_CINTURA } from "./cintura";
import { medirPeca } from "./medir";
import { pecaCalca } from "./pecas-teste";

/** Bermuda e calça tamanho 10 da grade: 28 cm de cintura e 40 cm de quadril. */
const REAL: [number, number] = [28, 40];
const BERMUDA = pecaCalca({ cintura: 28, quadril: 40, comprimento: 45, gancho: 26, boca: 22 });
const CALCA = pecaCalca({ cintura: 28, quadril: 40, comprimento: 85, gancho: 26, boca: 15, vao: 6 });
/** Erro aceito em cada medida, em cm. */
const ERRO = 0.5;

/** Posição do cartão logo abaixo do cós, a partir do meio de uma peça com esse comprimento. */
const abaixoDoCos = (comprimento: number): Ponto => [0, 10 - comprimento / 2];

/** A mesma posição na mesa depois de a peça girar em torno do meio dela. */
function girada([x, y]: Ponto, giro: number): Ponto {
  const angulo = (giro * Math.PI) / 180;
  return [x * Math.cos(angulo) - y * Math.sin(angulo), x * Math.sin(angulo) + y * Math.cos(angulo)];
}

function medir(cena: Cena, real = REAL) {
  const foto = fotografarCena(cena);
  const medicao = medirPeca(foto.imagem, RECEITA_CINTURA);
  if ("erro" in medicao) throw new Error(medicao.erro);
  expect(Math.abs(medicao.valores[0] - real[0])).toBeLessThan(ERRO);
  expect(Math.abs(medicao.valores[1] - real[1])).toBeLessThan(ERRO);
  return medicao;
}

describe("medidas da cintura", () => {
  const cena = {
    largura: 40,
    altura: 30,
    inclinacao: 20,
    direcao: 40,
    giroDaPeca: 7,
    cartao: { giro: 25, centro: [3, -14.5] as Ponto },
  };

  it("desfaz a inclinação da câmera quando os pontos são exatos", () => {
    const { pontos, cartao } = fotografarCena({ peca: BERMUDA, ...cena });
    const medidas = RECEITA_CINTURA.medir(pontos, cartao!)!;
    expect(medidas.valores[0]).toBeCloseTo(28, 6);
    expect(medidas.valores[1]).toBeCloseTo(40, 6);
    // O meio da região medida fica 12,5 cm acima do meio da bermuda, que está girada 7 graus na mesa.
    const giro = (7 * Math.PI) / 180;
    const regiao: Ponto = [12.5 * Math.sin(giro), -12.5 * Math.cos(giro)];
    expect(medidas.cartaoDoCentro).toBeCloseTo(Math.hypot(3 - regiao[0], -14.5 - regiao[1]), 6);
  });

  it("leva o quadril para a lateral da peça, 20 cm abaixo do cós", () => {
    const { pontos, cartao, contorno } = fotografarCena({ peca: BERMUDA, ...cena });
    const errados = { ...pontos, quadrilEsq: pontos.cosEsq, quadrilDir: pontos.cosDir };
    const ajustados = RECEITA_CINTURA.ajustar!(errados, cartao!, contorno);
    expect(ajustados.quadrilEsq[0]).toBeCloseTo(pontos.quadrilEsq[0], 6);
    expect(ajustados.quadrilDir[1]).toBeCloseTo(pontos.quadrilDir[1], 6);
  });

  it("o ponto do quadril arrastado à mão só desliza para a altura certa", () => {
    // Solto 3 cm para dentro da lateral e 6 cm abaixo da altura do quadril.
    const peca = { ...BERMUDA, marcas: { ...BERMUDA.marcas, solto: [17, 26] as Ponto } };
    const { pontos, cartao, contorno } = fotografarCena({ peca, ...cena });
    const arrastado = { ...pontos, quadrilDir: pontos.solto };
    const naMao = RECEITA_CINTURA.ajustar!(arrastado, cartao!, contorno, "quadrilDir");
    expect(RECEITA_CINTURA.medir(naMao, cartao!)!.valores[1]).toBeCloseTo(37, 6);
    // Ao mexer em outro ponto, o quadril volta para a beirada.
    const refeito = RECEITA_CINTURA.ajustar!(arrastado, cartao!, contorno, "cosEsq");
    expect(RECEITA_CINTURA.medir(refeito, cartao!)!.valores[1]).toBeCloseTo(40, 6);
  });
});

describe("medirPeca com bermuda e calça", () => {
  it("mede a bermuda fotografada de cima", () => {
    const medicao = medir({ peca: BERMUDA, cartao: { centro: abaixoDoCos(45) } });
    expect(medicao.avisos).toEqual([]);
  });

  it("corrige a foto inclinada, com a bermuda torta e o cartão em pé", () => {
    medir({
      peca: BERMUDA,
      giroDaPeca: 6,
      inclinacao: 15,
      direcao: 200,
      ruido: 15,
      cartao: { centro: abaixoDoCos(45), giro: 70, tarja: [25, 25, 25] },
    });
  });

  it("mede a calça inteira", () => {
    medir({
      peca: CALCA,
      largura: 1200,
      altura: 1600,
      inclinacao: 8,
      direcao: 60,
      cartao: { centro: abaixoDoCos(85), giro: 20 },
    });
  });

  it("mede a bermuda pequena, em que o cartão ocupa bastante da peça", () => {
    const bermuda4 = pecaCalca({ cintura: 22, quadril: 34, comprimento: 30, gancho: 19, boca: 18 });
    medir({ peca: bermuda4, inclinacao: 8, direcao: 30, cartao: { centro: abaixoDoCos(30), giro: 10 } }, [22, 34]);
  });

  it("avisa quando o cartão está longe do cós", () => {
    const medicao = medir({ peca: CALCA, largura: 1200, altura: 1600, cartao: { centro: [10, 25] } });
    expect(medicao.avisos).toHaveLength(1);
    expect(medicao.avisos[0]).toContain("cós");
  });

  it.each([90, -90, 180, 130])("acha o cós com a peça girada %i graus na mesa", (giro) => {
    const medicao = medir({
      peca: BERMUDA,
      giroDaPeca: giro,
      inclinacao: 8,
      direcao: 30,
      cartao: { centro: girada(abaixoDoCos(45), giro), giro: 20 },
    });
    expect(medicao.avisos).toEqual([]);
  });

  it("mede a calça deitada de lado", () => {
    medir({ peca: CALCA, pxPorCm: 12, giroDaPeca: 90, cartao: { centro: girada(abaixoDoCos(85), 90) } });
  });

  it("não confunde com o gancho o cós que o elástico deixa curvo", () => {
    // Bermuda de lado, com o meio do cós 6 cm para dentro: mais fundo que o vão das pernas, que tem 5 cm.
    const { contorno, marcas } = pecaCalca({ cintura: 28, quadril: 40, comprimento: 45, gancho: 40, boca: 22, vao: 2 });
    const franzida = { marcas, contorno: [contorno[0], [0, 6] as Ponto, ...contorno.slice(1)] };
    medir({ peca: franzida, giroDaPeca: -90, cartao: { centro: girada(abaixoDoCos(45), -90) } });
  });

  it("sem vão entre as pernas, mede a peça que está com o cós para cima", () => {
    const { contorno, marcas } = BERMUDA;
    const saia = { marcas, contorno: [...contorno.slice(0, 4), contorno[7], contorno[8]] };
    medir({ peca: saia, giroDaPeca: 5, cartao: { centro: abaixoDoCos(45) } });
  });

  it("recusa a peça em que a beirada entre as pontas do cós não é reta", () => {
    const { contorno, marcas } = BERMUDA;
    const dobrada = { marcas, contorno: [contorno[0], [0, 14] as Ponto, ...contorno.slice(1)] };
    const foto = fotografarCena({ peca: dobrada, cartao: { centro: [0, 5] } });
    const resultado = medirPeca(foto.imagem, RECEITA_CINTURA);
    expect((resultado as { erro: string }).erro).toContain("Não achei o cós");
  });

  it("sem cartão, devolve os pontos do cós para a correção à mão", () => {
    const resultado = medirPeca(fotografarCena({ peca: BERMUDA, cartao: null }).imagem, RECEITA_CINTURA);
    expect(resultado).toHaveProperty("erro");
    expect(resultado.pontosFoto).toHaveProperty("cosEsq");
  });

  it("da foto ao tamanho sugerido", () => {
    const medicao = medir({
      peca: BERMUDA,
      inclinacao: 8,
      direcao: 30,
      ruido: 12,
      cartao: { centro: abaixoDoCos(45), giro: 20 },
    });
    expect(sugerirTamanho(gradeDaPeca("bermuda")!, medicao.valores).tamanho).toBe("10");
  });
});
