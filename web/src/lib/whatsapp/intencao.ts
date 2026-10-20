import { CATALOGO, TAMANHOS } from "@/data/catalogo";

export const ID = {
  menuProcurar: "menu.procurar",
  menuDoar: "menu.doar",
  menuComprar: "menu.comprar",
  menuBeneficios: "menu.beneficios",
  menuReservar: "menu.reservar",
  pecaPrefixo: "peca.",
  tamPrefixo: "tam.",
  avisar: "procuro.avisar",
  comprar: "procuro.comprar",
  compraSite: "compra.site",
  compraOutra: "compra.outra",
  verTodas: "procuro.ver_todas",
  verWa: "procuro.ver_wa",
  pedirPrefixo: "pedir.",
  verPrefixo: "ver.",
} as const;

function textoLimpo(entrada: string) {
  return entrada
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function querMenu(escolha: string | null, texto: string) {
  if (escolha === "menu" || escolha === "voltar") return true;
  const t = textoLimpo(texto);
  return /^(oi|ola|olaa|hey|eae|e ai|menu|inicio|voltar|oi,?\s*tudo bem\??)$/.test(
    t,
  );
}

export function escolheuComprar(escolha: string | null, texto: string) {
  if (escolha === ID.menuComprar || escolha === ID.compraSite) return true;
  const t = textoLimpo(texto);
  return (
    t === "comprar" ||
    t.startsWith("comprar ") ||
    t.startsWith("quero comprar") ||
    t.includes("uniforme novo") ||
    t.includes("montar pedido") ||
    t.includes("montar meu pedido")
  );
}

export function escolheuProcurar(escolha: string | null, texto: string) {
  if (escolha === ID.menuProcurar) return true;
  const t = textoLimpo(texto);
  return (
    t.includes("procurar") ||
    t.includes("receber") ||
    t.includes("doacao") ||
    t === "quero uma peca" ||
    t === "preciso de uniforme"
  );
}

export function escolheuDoar(escolha: string | null, texto: string) {
  if (escolha === ID.menuDoar) return true;
  const t = textoLimpo(texto);
  return t === "doar" || t.startsWith("doar ") || t.startsWith("quero doar");
}

export function escolheuReservar(escolha: string | null, texto: string) {
  if (escolha === ID.menuReservar) return true;
  const t = textoLimpo(texto);
  return t === "reservar" || t.startsWith("quero reservar") || t.startsWith("reservar uniforme");
}

export function escolheuBeneficios(escolha: string | null, texto: string) {
  if (escolha === ID.menuBeneficios) return true;
  const t = textoLimpo(texto);
  return t.includes("beneficio") || t.includes("placar") || t.includes("recompensa");
}

/** Resolve peça pelo id do botão, pelo id do catálogo ou por apelido. */
export function detectarModelo(escolha: string | null, texto: string): string | null {
  if (escolha?.startsWith(ID.pecaPrefixo)) {
    const id = escolha.slice(ID.pecaPrefixo.length);
    return CATALOGO.some((item) => item.id === id) ? id : null;
  }
  if (escolha && CATALOGO.some((item) => item.id === escolha)) return escolha;

  const t = textoLimpo(texto);
  if (!t) return null;

  const direto = CATALOGO.find((item) => textoLimpo(item.name) === t);
  if (direto) return direto.id;

  if (/\bcami(seta)?s?\b/.test(t) && t.includes("longa")) {
    return "camiseta-manga-longa";
  }
  if (/\bcami(seta)?s?\b/.test(t) && (t.includes("curta") || t.includes("manga curta"))) {
    return "camiseta-manga-curta";
  }
  if (/\b(short[\s-]?saia|saia)\b/.test(t)) return "short-saia";
  if (/\b(bermuda|short|shorts)\b/.test(t)) return "bermuda";
  if (/\b(blusa|agasalho|casaco|blusao)\b/.test(t)) return "blusa";
  if (/\bcalcas?\b/.test(t)) return "calca";
  return null;
}

export function detectarTamanho(escolha: string | null, texto: string): string | null {
  if (escolha?.startsWith(ID.tamPrefixo)) {
    const tam = escolha.slice(ID.tamPrefixo.length);
    return (TAMANHOS as readonly string[]).includes(tam) ? tam : null;
  }
  const t = textoLimpo(texto).replace(/^tam(anho)?\s*/, "");
  const soNumero = t.replace(/\D/g, "");
  if ((TAMANHOS as readonly string[]).includes(soNumero)) return soNumero;
  return null;
}

export function idAnuncio(escolha: string | null, prefixo: string) {
  if (!escolha?.startsWith(prefixo)) return null;
  const id = escolha.slice(prefixo.length);
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}
