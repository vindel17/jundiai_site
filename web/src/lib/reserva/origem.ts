export const CANAIS_ORIGEM = [
  "panfleto",
  "social",
  "pago",
  "indicacao",
  "direto",
] as const;

export type CanalOrigem = (typeof CANAIS_ORIGEM)[number];

export type Origem = {
  canal: CanalOrigem;
  codigo: string;
  texto: string;
};

const ROTULO: Record<CanalOrigem, string> = {
  panfleto: "Panfleto",
  social: "Rede social",
  pago: "Tráfego pago",
  indicacao: "Indicação",
  direto: "Direto",
};

export function rotuloCanal(canal: CanalOrigem) {
  return ROTULO[canal];
}

export function origemDireta(): Origem {
  return { canal: "direto", codigo: "", texto: "" };
}

function limpar(entrada: string) {
  return entrada
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const IGNORAR = new Set([
  "vim",
  "pelo",
  "pela",
  "por",
  "do",
  "da",
  "de",
  "no",
  "na",
  "um",
  "uma",
  "o",
  "a",
]);

const PALAVRAS_CANAL = new Set([
  "panfleto",
  "folheto",
  "anuncio",
  "ads",
  "meta",
  "google",
  "trafego",
  "instagram",
  "facebook",
  "tiktok",
  "indicacao",
  "rede",
  "social",
]);

function codigoNoOriginal(entrada: string) {
  const partes = entrada.trim().split(/\s+/);
  const token = [...partes].reverse().find((parte) => {
    const palavra = parte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return (
      /^[a-z0-9][a-z0-9_-]{1,40}$/.test(palavra) &&
      !IGNORAR.has(palavra) &&
      !PALAVRAS_CANAL.has(palavra)
    );
  });
  return (token ?? "").slice(0, 40);
}

/**
 * Lê a primeira mensagem do QR ou do anúncio.
 * "Vim pelo panfleto JDI-042", "Vim pelo instagram BIO",
 * "Vim pelo anuncio META-01", "Vim pela indicacao abc12345".
 * Frase longa sem esse convite não vira origem.
 */
export function lerOrigem(entrada: string): Origem | null {
  const texto = limpar(entrada);
  if (!texto || texto.length > 80) return null;

  const pago = /\b(anuncio|ads|meta|google|trafego)\b/;
  const panfleto = /\b(panfleto|folheto)\b/;
  const social = /\b(instagram|facebook|tiktok|rede social)\b/;
  const indicacao = /\bindicacao\b/;

  let canal: CanalOrigem | null = null;
  if (panfleto.test(texto)) canal = "panfleto";
  else if (pago.test(texto)) canal = "pago";
  else if (social.test(texto)) canal = "social";
  else if (indicacao.test(texto)) canal = "indicacao";
  if (!canal) return null;

  const codigoBruto = codigoNoOriginal(entrada);
  return {
    canal,
    codigo: canal === "indicacao" ? codigoBruto.toLowerCase() : codigoBruto,
    texto: entrada.trim().slice(0, 200),
  };
}
