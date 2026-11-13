/** Foto em RGBA, como sai de `getImageData` no canvas. */
export type Imagem = { largura: number; altura: number; dados: Uint8ClampedArray };

/** 1 onde é peça, 0 onde é fundo. */
export type Mascara = { largura: number; altura: number; dados: Uint8Array };

/** Raio, em pixels, da limpeza que apaga fiapos e pontinhos soltos. */
const RAIO_LIMPEZA = 2;

export function pixelsDaBorda(largura: number, altura: number): number[] {
  const borda: number[] = [];
  for (let x = 0; x < largura; x++) borda.push(x, (altura - 1) * largura + x);
  for (let y = 1; y < altura - 1; y++) borda.push(y * largura, y * largura + largura - 1);
  return borda;
}

export function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.floor(ordenados.length / 2)];
}

/** Cor mediana (RGB) dos pixels de índice `indices`. */
export function corMediana({ dados }: Imagem, indices: number[]): number[] {
  return [0, 1, 2].map((c) => mediana(indices.map((i) => dados[i * 4 + c])));
}

/** Distância de cada pixel até `cor`, de 0 a 255. */
export function distanciaDaCor({ largura, altura, dados }: Imagem, cor: number[]): Uint8Array {
  const maxima = Math.sqrt(3) * 255;
  const distancia = new Uint8Array(largura * altura);
  for (let i = 0; i < distancia.length; i++) {
    const r = dados[i * 4] - cor[0];
    const g = dados[i * 4 + 1] - cor[1];
    const b = dados[i * 4 + 2] - cor[2];
    distancia[i] = Math.round((Math.sqrt(r * r + g * g + b * b) / maxima) * 255);
  }
  return distancia;
}

/** Limiar de Otsu: o corte que melhor separa os valores em dois grupos. */
function limiarOtsu(valores: Uint8Array): number {
  const histograma = new Array<number>(256).fill(0);
  for (const v of valores) histograma[v]++;
  const total = valores.length;
  const somaTotal = histograma.reduce((s, n, v) => s + n * v, 0);

  let pesoFundo = 0;
  let somaFundo = 0;
  let melhor = -1;
  let limiar = 0;
  for (let t = 0; t < 256; t++) {
    pesoFundo += histograma[t];
    somaFundo += t * histograma[t];
    const pesoPeca = total - pesoFundo;
    if (!pesoFundo || !pesoPeca) continue;
    const diferenca = somaFundo / pesoFundo - (somaTotal - somaFundo) / pesoPeca;
    const separacao = pesoFundo * pesoPeca * diferenca * diferenca;
    if (separacao > melhor) {
      melhor = separacao;
      limiar = t;
    }
  }
  return limiar;
}

/**
 * Marca com `valor` os pixels alcançáveis a partir das sementes, andando
 * pelos 4 vizinhos onde `pode` é verdadeiro. Devolve quantos marcou.
 */
function inundar(
  largura: number,
  altura: number,
  pode: (i: number) => boolean,
  sementes: number[],
  marca: Int32Array,
  valor: number,
  fila: Int32Array,
): number {
  let fim = 0;
  const visitar = (i: number) => {
    if (marca[i] || !pode(i)) return;
    marca[i] = valor;
    fila[fim++] = i;
  };
  sementes.forEach(visitar);
  for (let inicio = 0; inicio < fim; inicio++) {
    const i = fila[inicio];
    const x = i % largura;
    if (x > 0) visitar(i - 1);
    if (x < largura - 1) visitar(i + 1);
    if (i >= largura) visitar(i - largura);
    if (i < (altura - 1) * largura) visitar(i + largura);
  }
  return fim;
}

/** Numera as manchas a partir de 1 e conta os pixels de cada uma (`tamanhos[0]` não é mancha). */
export function rotularRegioes({ largura, altura, dados }: Mascara) {
  const rotulos = new Int32Array(dados.length);
  const fila = new Int32Array(dados.length);
  const tamanhos = [0];
  for (let i = 0; i < dados.length; i++) {
    if (!dados[i] || rotulos[i]) continue;
    const rotulo = tamanhos.length;
    tamanhos.push(inundar(largura, altura, (j) => dados[j] === 1, [i], rotulos, rotulo, fila));
  }
  return { rotulos, tamanhos };
}

/** Fica só com a maior mancha: a camiseta, sem sujeira ou objetos pequenos. */
function maiorRegiao(peca: Uint8Array, largura: number, altura: number): Uint8Array {
  const { rotulos, tamanhos } = rotularRegioes({ largura, altura, dados: peca });
  const melhor = tamanhos.indexOf(Math.max(...tamanhos));
  return Uint8Array.from(rotulos, (r) => (melhor && r === melhor ? 1 : 0));
}

/** Estampas ou etiquetas da cor do fundo viram peça: só é fundo o que encosta na borda. */
function preencherBuracos(peca: Uint8Array, largura: number, altura: number): Uint8Array {
  const fora = new Int32Array(peca.length);
  const fila = new Int32Array(peca.length);
  inundar(largura, altura, (i) => peca[i] === 0, pixelsDaBorda(largura, altura), fora, 1, fila);
  return Uint8Array.from(fora, (f) => (f ? 0 : 1));
}

/** Mínimo (`encolher`) ou máximo numa janela de 2r+1 pixels, numa direção. */
function passada(
  origem: Uint8Array,
  largura: number,
  altura: number,
  raio: number,
  encolher: boolean,
  horizontal: boolean,
): Uint8Array {
  const saida = new Uint8Array(origem.length);
  const [linhas, colunas, passo, salto] = horizontal
    ? [altura, largura, 1, largura]
    : [largura, altura, largura, 1];
  const procurado = encolher ? 0 : 1;
  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < colunas; c++) {
      let valor = 1 - procurado;
      for (let k = -raio; k <= raio; k++) {
        const cc = c + k;
        const v = cc < 0 || cc >= colunas ? 0 : origem[l * salto + cc * passo];
        if (v === procurado) {
          valor = procurado;
          break;
        }
      }
      saida[l * salto + c * passo] = valor;
    }
  }
  return saida;
}

/** Abertura: encolhe e depois expande, apagando fiapos mais finos que o raio. */
function abrir(peca: Uint8Array, largura: number, altura: number, raio: number): Uint8Array {
  let m = peca;
  for (const encolher of [true, false]) {
    m = passada(m, largura, altura, raio, encolher, true);
    m = passada(m, largura, altura, raio, encolher, false);
  }
  return m;
}

/** Tira `raio` pixels de toda a beirada da máscara. */
export function encolher({ largura, altura, dados }: Mascara, raio: number): Mascara {
  const deitada = passada(dados, largura, altura, raio, true, true);
  return { largura, altura, dados: passada(deitada, largura, altura, raio, true, false) };
}

/** Separa a peça do fundo pelo contraste de cor. O fundo é a cor mediana da borda da foto. */
export function separarPeca(imagem: Imagem): Mascara {
  const { largura, altura } = imagem;
  const distancia = distanciaDaCor(imagem, corMediana(imagem, pixelsDaBorda(largura, altura)));
  const limiar = limiarOtsu(distancia);
  let peca: Uint8Array = Uint8Array.from(distancia, (d) => (d > limiar ? 1 : 0));
  peca = abrir(peca, largura, altura, RAIO_LIMPEZA);
  peca = preencherBuracos(maiorRegiao(peca, largura, altura), largura, altura);
  return { largura, altura, dados: peca };
}
