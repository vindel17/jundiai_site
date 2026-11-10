/**
 * Gera um arquivo GLB (glTF 2.0 binário) com quadriláteros deitados no
 * chão. Unidades em metros, eixo Y para cima — é o que o AR Quick Look
 * e o Scene Viewer usam para posicionar o modelo em escala real.
 */

/** Ponto no plano do chão: [x, z] em metros (X para a direita, Z para frente). */
export type Ponto = [number, number];

/** Quadrilátero no chão, cantos em sequência (horário ou anti-horário). */
export type Faixa = {
  cantos: [Ponto, Ponto, Ponto, Ponto];
  /** Cor RGB de 0 a 1 */
  cor: [number, number, number];
  /** Altura acima do chão em metros; onde faixas se cruzam, a mais alta fica por cima. */
  altura?: number;
};

/** Faixas ficam 1 mm acima do chão para não piscarem junto com a superfície. */
const ALTURA_M = 0.001;

type Primitiva = {
  cor: [number, number, number];
  posicoes: Float32Array;
  normais: Float32Array;
  indices: Uint16Array;
};

function chaveCor(cor: [number, number, number]): string {
  return cor.join(",");
}

function montarPrimitiva(faixas: Faixa[]): Primitiva {
  const posicoes = new Float32Array(faixas.length * 12);
  const normais = new Float32Array(faixas.length * 12);
  const indices = new Uint16Array(faixas.length * 6);

  faixas.forEach((f, i) => {
    const [p0, p1, p2, p3] = f.cantos;
    posicoes.set(
      [p0, p1, p2, p3].flatMap(([x, z]) => [x, f.altura ?? ALTURA_M, z]),
      i * 12,
    );
    normais.set([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], i * 12);
    const v = i * 4;
    // Componente Y de (p1 - p0) × (p2 - p0): a face precisa apontar para cima.
    const y = (p1[1] - p0[1]) * (p2[0] - p0[0]) - (p1[0] - p0[0]) * (p2[1] - p0[1]);
    indices.set(y > 0 ? [v, v + 1, v + 2, v, v + 2, v + 3] : [v, v + 2, v + 1, v, v + 3, v + 2], i * 6);
  });

  return { cor: faixas[0].cor, posicoes, normais, indices };
}

function limites(posicoes: Float32Array) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < posicoes.length; i += 3) {
    for (let e = 0; e < 3; e++) {
      min[e] = Math.min(min[e], posicoes[i + e]);
      max[e] = Math.max(max[e], posicoes[i + e]);
    }
  }
  return { min, max };
}

function alinhar4(n: number): number {
  return Math.ceil(n / 4) * 4;
}

export function gerarGlb(faixas: Faixa[]): Uint8Array<ArrayBuffer> {
  const grupos = new Map<string, Faixa[]>();
  for (const f of faixas) {
    const chave = chaveCor(f.cor);
    grupos.set(chave, [...(grupos.get(chave) ?? []), f]);
  }
  const primitivas = [...grupos.values()].map(montarPrimitiva);

  const blocos: Uint8Array[] = [];
  const bufferViews: object[] = [];
  const accessors: object[] = [];
  let offset = 0;

  function anexar(dados: Float32Array | Uint16Array, alvo: number): number {
    const bytes = new Uint8Array(dados.buffer, dados.byteOffset, dados.byteLength);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target: alvo });
    const tamanho = alinhar4(bytes.length);
    const bloco = new Uint8Array(tamanho);
    bloco.set(bytes);
    blocos.push(bloco);
    offset += tamanho;
    return bufferViews.length - 1;
  }

  const meshPrimitives = primitivas.map((p, i) => {
    const vPos = anexar(p.posicoes, 34962);
    const vNor = anexar(p.normais, 34962);
    const vIdx = anexar(p.indices, 34963);
    const base = accessors.length;
    accessors.push(
      { bufferView: vPos, componentType: 5126, count: p.posicoes.length / 3, type: "VEC3", ...limites(p.posicoes) },
      { bufferView: vNor, componentType: 5126, count: p.normais.length / 3, type: "VEC3" },
      { bufferView: vIdx, componentType: 5123, count: p.indices.length, type: "SCALAR" },
    );
    return { attributes: { POSITION: base, NORMAL: base + 1 }, indices: base + 2, material: i };
  });

  const gltf = {
    asset: { version: "2.0", generator: "uniforme-jundiai-gabarito" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: meshPrimitives }],
    materials: primitivas.map((p) => ({
      pbrMetallicRoughness: { baseColorFactor: [...p.cor, 1], metallicFactor: 0, roughnessFactor: 1 },
      emissiveFactor: p.cor,
      doubleSided: true,
    })),
    buffers: [{ byteLength: offset }],
    bufferViews,
    accessors,
  };

  return empacotar(gltf, blocos, offset);
}

function empacotar(gltf: object, blocos: Uint8Array[], tamanhoBin: number): Uint8Array<ArrayBuffer> {
  const json = new TextEncoder().encode(JSON.stringify(gltf));
  const tamanhoJson = alinhar4(json.length);
  const total = 12 + 8 + tamanhoJson + 8 + tamanhoBin;

  const saida = new Uint8Array(total);
  const view = new DataView(saida.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);

  view.setUint32(12, tamanhoJson, true);
  view.setUint32(16, 0x4e4f534a, true);
  saida.fill(0x20, 20, 20 + tamanhoJson);
  saida.set(json, 20);

  let p = 20 + tamanhoJson;
  view.setUint32(p, tamanhoBin, true);
  view.setUint32(p + 4, 0x004e4942, true);
  p += 8;
  for (const bloco of blocos) {
    saida.set(bloco, p);
    p += bloco.length;
  }
  return saida;
}
