import { existsSync } from "node:fs";
import path from "node:path";
import { getCatalogItem } from "@/data/catalogo";
import type { PecaKit } from "./kit";

/** O WhatsApp só aceita JPG ou PNG em mensagem de imagem. */
const FORMATO_ACEITO = /\.(jpe?g|png)$/i;

/** Caminho público da foto, ou "" quando o arquivo ainda não está em /public. */
function fotoPublica(caminho: string) {
  if (!FORMATO_ACEITO.test(caminho)) return "";
  return existsSync(path.join(process.cwd(), "public", caminho)) ? caminho : "";
}

/** Usa a foto do catálogo; se for SVG, procura /produtos/<id>.jpg. */
export function fotoDaPeca(peca: PecaKit) {
  const doCatalogo = getCatalogItem(peca.catalogoId)?.image ?? "";
  return fotoPublica(doCatalogo) || fotoPublica(`/produtos/${peca.catalogoId}.jpg`);
}
