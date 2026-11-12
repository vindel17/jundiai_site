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
