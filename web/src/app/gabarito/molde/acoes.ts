"use server";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TAMANHOS_CAMISETA_ADULTO, type TamanhoCamisetaAdulto } from "@/lib/gabarito/camiseta-adulto";
import { validarForma, type Forma } from "@/lib/gabarito/forma";
import type { Ponto } from "@/lib/gabarito/glb";

const ARQUIVO = path.join(process.cwd(), "src/data/moldes/camiseta-adulto.json");

const arredondar = (v: number) => Math.round(v * 100) / 100;

function arredondarForma(forma: Forma): Forma {
  return {
    comprimento: arredondar(forma.comprimento),
    largura: arredondar(forma.largura),
    larguraGola: arredondar(forma.larguraGola),
    profundidadeGola: arredondar(forma.profundidadeGola),
    alturaCava: arredondar(forma.alturaCava),
    metade: forma.metade.map(([x, z]): Ponto => [arredondar(x), arredondar(z)]),
  };
}

/** JSON com cada ponto [x, z] numa linha só, para o arquivo ficar fácil de revisar. */
function formatar(moldes: object): string {
  return `${JSON.stringify(moldes, null, 2).replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, "[$1, $2]")}\n`;
}

function eTamanho(valor: string): valor is TamanhoCamisetaAdulto {
  return (TAMANHOS_CAMISETA_ADULTO as string[]).includes(valor);
}

/** Grava o molde no arquivo do projeto. Só no computador: no servidor publicado o disco é apagado a cada deploy. */
export async function salvarMolde(tamanho: string, forma: unknown): Promise<{ erro?: string }> {
  if (process.env.NODE_ENV !== "development") {
    return { erro: "Moldes só podem ser salvos com o site rodando no computador." };
  }
  if (!eTamanho(tamanho)) return { erro: "Tamanho inválido." };
  const valida = validarForma(forma);
  if (!valida) return { erro: "O contorno veio incompleto. Gere de novo." };

  const atuais = JSON.parse(await readFile(ARQUIVO, "utf8")) as Record<string, unknown>;
  atuais[tamanho] = arredondarForma(valida);
  const ordenados = Object.fromEntries(
    TAMANHOS_CAMISETA_ADULTO.filter((t) => t in atuais).map((t) => [t, atuais[t]]),
  );
  await writeFile(ARQUIVO, formatar(ordenados));
  return {};
}
