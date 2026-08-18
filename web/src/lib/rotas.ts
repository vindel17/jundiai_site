/** Destinos internos usados depois de entrar ou de completar o perfil. */

const ROTULOS: Record<string, string> = {
  "/doacao/doar": "Anunciar uma doação",
  "/doacao/receber": "Ver peças disponíveis",
  "/comprar": "Voltar para a loja",
  "/pedido/resumo": "Voltar para o pedido",
  "/conta": "Ir para minha conta",
};

/** Por que o site pediu o cadastro do aluno antes de seguir. */
const MOTIVOS_PERFIL: Record<string, string> = {
  "/doacao/doar": "Para anunciar uma peça, falta o cadastro do aluno.",
  "/doacao/receber": "Para pedir uma peça, falta o cadastro do aluno.",
};

/**
 * Aceita só caminho do próprio site. Barra dupla é rejeitada porque
 * `//outro-site.com` é URL absoluta e viraria redirecionamento aberto.
 */
export function rotaInterna(valor?: string | null): string | undefined {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) {
    return undefined;
  }
  return valor;
}

export function rotuloDoDestino(rota: string): string {
  return ROTULOS[rota] ?? "Continuar";
}

export function motivoDoPerfil(rota?: string): string | undefined {
  return rota ? MOTIVOS_PERFIL[rota] : undefined;
}
