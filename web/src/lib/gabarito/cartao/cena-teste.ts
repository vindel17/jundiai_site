import type { Ponto } from "../glb";
import { dentro, sorteio } from "../molde/foto-teste";
import type { Imagem } from "../molde/mascara";
import { CARTAO_CM } from "./achar";
import type { Quadrilatero } from "./homografia";
import type { PecaDeTeste } from "./pecas-teste";
import type { Pontos } from "./receita";

/** Apoio para os testes: desenha a foto de uma peça com um cartão em cima, como um celular a veria. */

type Cor = [number, number, number];

export type Cena<P extends string = string> = {
  peca: PecaDeTeste<P>;
  largura?: number;
  altura?: number;
  pxPorCm?: number;
  /** Quanto o celular está inclinado, em graus, e para que lado */
  inclinacao?: number;
  direcao?: number;
  /** Quanto a peça está torta na mesa, em graus */
  giroDaPeca?: number;
  tecido?: Cor;
  fundo?: Cor;
  /**
   * Posição em cm a partir do meio da peça. `tarja` pinta a faixa
   * magnética do verso. `null` deixa a foto sem cartão.
   */
  cartao?: { centro?: Ponto; giro?: number; cor?: Cor; tarja?: Cor } | null;
  /** Granulado: quanto cada cor varia para mais ou para menos */
  ruido?: number;
  /** Luz desigual: fração de claridade a mais de um lado da foto e a menos do outro */
  sombra?: number;
  /** Foto fora de foco: raio, em pixels, da mancha em que cada ponto se espalha */
  desfoque?: number;
};

export type Foto<P extends string = string> = {
  imagem: Imagem;
  /** Onde os pontos de medida, a beirada e os cantos do cartão caem de verdade, em pixels */
  pontos: Pontos<P>;
  contorno: Ponto[];
  cartao: Quadrilatero | null;
};

/** Altura do celular sobre a mesa, em cm. */
const ALTURA_DA_CAMERA = 90;
const RAIO_DO_CANTO = 0.3;
/** Onde a tarja magnética começa e termina, em cm a partir da borda de cima do cartão. */
const TARJA = [0.5, 1.5];
const SUBDIVISOES = 4;

const graus = (g: number) => (g * Math.PI) / 180;

function girar([x, y]: Ponto, angulo: number): Ponto {
  const [c, s] = [Math.cos(angulo), Math.sin(angulo)];
  return [x * c - y * s, x * s + y * c];
}

/** Câmera olhando para baixo, inclinada: leva da mesa (cm) para a foto (pixels) e de volta. */
function camera(cena: Required<Pick<Cena, "largura" | "altura" | "pxPorCm" | "inclinacao" | "direcao">>) {
  const foco = cena.pxPorCm * ALTURA_DA_CAMERA;
  const [cos, sen] = [Math.cos(graus(cena.inclinacao)), Math.sin(graus(cena.inclinacao))];
  const [dx, dy] = [Math.cos(graus(cena.direcao)), Math.sin(graus(cena.direcao))];
  const [mx, my] = [(cena.largura - 1) / 2, (cena.altura - 1) / 2];
  return {
    paraFoto([x, y]: Ponto): Ponto {
      const [s, t] = [x * dx + y * dy, -x * dy + y * dx];
      const distancia = ALTURA_DA_CAMERA + s * sen;
      const [a, b] = [(foco * s * cos) / distancia, (foco * t) / distancia];
      return [mx + a * dx - b * dy, my + a * dy + b * dx];
    },
    paraMesa([px, py]: Ponto): Ponto {
      const [a, b] = [(px - mx) * dx + (py - my) * dy, -(px - mx) * dy + (py - my) * dx];
      const s = (a * ALTURA_DA_CAMERA) / (foco * cos - a * sen);
      const t = (b * (ALTURA_DA_CAMERA + s * sen)) / foco;
      return [s * dx - t * dy, s * dy + t * dx];
    },
  };
}

function noCartao([u, v]: Ponto): boolean {
  const [a, b] = [Math.abs(u) - CARTAO_CM.largura / 2, Math.abs(v) - CARTAO_CM.altura / 2];
  if (a > 0 || b > 0) return false;
  const [ca, cb] = [a + RAIO_DO_CANTO, b + RAIO_DO_CANTO];
  return ca <= 0 || cb <= 0 || Math.hypot(ca, cb) <= RAIO_DO_CANTO;
}

/** Média de uma janela de 2r+1 pixels, na horizontal e depois na vertical. */
function desfocar({ largura, altura, dados }: Imagem, raio: number): Imagem {
  const passada = (origem: Uint8ClampedArray, passo: number, tamanho: number, linhas: number, salto: number) => {
    const saida = new Uint8ClampedArray(origem.length);
    for (let l = 0; l < linhas; l++) {
      for (let c = 0; c < tamanho; c++) {
        for (let canal = 0; canal < 4; canal++) {
          let soma = 0;
          for (let k = -raio; k <= raio; k++) {
            const cc = Math.min(Math.max(c + k, 0), tamanho - 1);
            soma += origem[(l * salto + cc * passo) * 4 + canal];
          }
          saida[(l * salto + c * passo) * 4 + canal] = soma / (2 * raio + 1);
        }
      }
    }
    return saida;
  };
  const deitada = passada(dados, 1, largura, altura, largura);
  return { largura, altura, dados: passada(deitada, largura, altura, largura, 1) };
}

export function fotografarCena<P extends string>(cena: Cena<P>): Foto<P> {
  const {
    largura = 1600,
    altura = 1200,
    pxPorCm = 16,
    inclinacao = 0,
    direcao = 0,
    giroDaPeca = 0,
    tecido = [30, 45, 110],
    fundo = [235, 235, 230],
    ruido = 0,
    sombra = 0,
    desfoque = 0,
  } = cena;
  const cartao = cena.cartao === null ? null : { centro: [0, 0] as Ponto, giro: 0, cor: [240, 200, 60] as Cor, ...cena.cartao };
  const { paraFoto, paraMesa } = camera({ largura, altura, pxPorCm, inclinacao, direcao });

  // A mesa tem o meio da peça na origem, com a barra para baixo.
  const lados = [0, 1].map((eixo) => cena.peca.contorno.map((p) => p[eixo]));
  const [cx, cy] = lados.map((valores) => (Math.min(...valores) + Math.max(...valores)) / 2);
  const naMesa = ([x, z]: Ponto) => girar([x - cx, z - cy], graus(giroDaPeca));
  const peca = cena.peca.contorno.map(naMesa);
  const xs = peca.map((p) => p[0]);
  const ys = peca.map((p) => p[1]);
  const caixa = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

  const cores = [fundo, tecido, cartao?.cor ?? tecido, cartao?.tarja ?? cartao?.cor ?? tecido];
  const classe = (px: number, py: number): number => {
    const p = paraMesa([px, py]);
    if (cartao) {
      const local = girar([p[0] - cartao.centro[0], p[1] - cartao.centro[1]], -graus(cartao.giro));
      const daBorda = local[1] + CARTAO_CM.altura / 2;
      if (noCartao(local)) return daBorda >= TARJA[0] && daBorda <= TARJA[1] ? 3 : 2;
    }
    if (p[0] < caixa[0] || p[0] > caixa[1] || p[1] < caixa[2] || p[1] > caixa[3]) return 0;
    return dentro(p, peca) ? 1 : 0;
  };

  // Classe em cada quina de pixel: onde as 4 quinas concordam, o pixel é liso.
  const quinas = new Uint8Array((largura + 1) * (altura + 1));
  for (let y = 0; y <= altura; y++) {
    for (let x = 0; x <= largura; x++) quinas[y * (largura + 1) + x] = classe(x - 0.5, y - 0.5);
  }

  const aleatorio = sorteio(11);
  const dados = new Uint8ClampedArray(largura * altura * 4);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const q = y * (largura + 1) + x;
      const cor = [0, 0, 0];
      if (quinas[q] === quinas[q + 1] && quinas[q] === quinas[q + largura + 1] && quinas[q] === quinas[q + largura + 2]) {
        cores[quinas[q]].forEach((v, c) => (cor[c] = v));
      } else {
        // Na beirada, o pixel mistura as cores na proporção em que cada uma o ocupa.
        for (let j = 0; j < SUBDIVISOES; j++) {
          for (let i = 0; i < SUBDIVISOES; i++) {
            const k = classe(x - 0.5 + (i + 0.5) / SUBDIVISOES, y - 0.5 + (j + 0.5) / SUBDIVISOES);
            cores[k].forEach((v, c) => (cor[c] += v / SUBDIVISOES ** 2));
          }
        }
      }
      const luz = 1 + sombra * ((2 * x) / largura - 1);
      dados.set([...cor.map((v) => v * luz + (aleatorio() * 2 - 1) * ruido), 255], (y * largura + x) * 4);
    }
  }

  const ponto = (p: Ponto) => paraFoto(naMesa(p));
  const nomes = Object.keys(cena.peca.marcas) as P[];
  const [a, b] = [CARTAO_CM.largura / 2, CARTAO_CM.altura / 2];
  const nitida: Imagem = { largura, altura, dados };
  return {
    imagem: desfoque ? desfocar(nitida, desfoque) : nitida,
    pontos: Object.fromEntries(nomes.map((nome) => [nome, ponto(cena.peca.marcas[nome])])) as Pontos<P>,
    contorno: cena.peca.contorno.map(ponto),
    cartao: cartao && ([[-a, -b], [a, -b], [a, b], [-a, b]] as Quadrilatero).map((canto): Ponto => {
      const [x, y] = girar(canto, graus(cartao.giro));
      return paraFoto([x + cartao.centro[0], y + cartao.centro[1]]);
    }) as Quadrilatero,
  };
}
