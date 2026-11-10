import { CORES, retangulo } from "./desenho";
import type { Faixa } from "./glb";

const CM = 0.01;

/** Marca amarela logo acima de um ponto do contorno, para alinhar a peça. */
export function marcaAlinhamento(x: number, z: number): Faixa {
  return retangulo(x - 0.6 * CM, z - 1.6 * CM, x + 0.6 * CM, z - 0.4 * CM, CORES.amarelo);
}
