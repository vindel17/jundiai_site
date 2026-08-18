export const COOKIE_INDICACAO = "uj_ind";
export const COOKIE_INDICACAO_DIAS = 30;
export const CODIGO_INDICACAO = /^[a-z0-9]{8}$/;
export const FAIXA_CAMISETA_CENTAVOS = 35_000;
export const CONFIRMACAO_DIAS = 7;

export function origemPublica(host?: string | null, proto?: string | null) {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  if (host) return `${proto || "https"}://${host}`;
  return "https://uniformejundiai.com.br";
}

export function urlIndicacao(origem: string, codigo: string) {
  return `${origem}/i/${codigo}`;
}

export function textoConvite(link: string) {
  return [
    "O uniforme da rede municipal de Jundiaí.",
    "",
    link,
    "",
    "Quem chega por aqui cria conta, coloca o nome do aluno e ganha 1 etiqueta. Na primeira compra, são 5.",
  ].join("\n");
}
