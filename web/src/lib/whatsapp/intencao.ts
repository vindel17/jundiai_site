import { CATALOGO, TAMANHOS } from "@/data/catalogo";

export const ID = {
  menuComprar: "menu.comprar",
  menuBeneficios: "menu.beneficios",
  menuReservar: "menu.reservar",
  menuMinhasReservas: "menu.minhas_reservas",
  menuAtendente: "menu.atendente",
  pecaPrefixo: "peca.",
  tamPrefixo: "tam.",
  compraSite: "compra.site",
  compraOutra: "compra.outra",
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

export function pediuAtendente(escolha: string | null, texto: string) {
  if (escolha === ID.menuAtendente) return true;
  const limpo = textoLimpo(texto);
  return /^(atendente|humano|atendimento humano)[.!?]*$/.test(limpo)
    || /\bfalar com (?:(?:um|uma|o|a) )?(?:atendente|humano|pessoa|equipe)\b/.test(limpo);
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

export function escolheuReservar(escolha: string | null, texto: string) {
  if (escolha === ID.menuReservar) return true;
  const t = textoLimpo(texto);
  return t === "reservar" || t.startsWith("quero reservar") || t.startsWith("reservar uniforme")
    || querContinuarReserva(texto);
}

export function querContinuarReserva(texto: string) {
  return /^continuar (?:a |minha )?(?:pre-)?reserva[.!?]*$/.test(textoLimpo(texto));
}

export function escolheuMinhasReservas(escolha: string | null, texto: string) {
  if (escolha === ID.menuMinhasReservas) return true;
  const t = textoLimpo(texto);
  return /^(ver )?(minhas? reservas?|minha pre-?reserva)$/.test(t) || t.startsWith("ver minha reserva");
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
