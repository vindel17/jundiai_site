/**
 * IP do visitante para chavear limites de requisição.
 *
 * No Render todo tráfego passa pelo Cloudflare, que define `CF-Connecting-IP`
 * e não aceita que o cliente envie o seu. Já o `X-Forwarded-For` pode vir com
 * valores escolhidos por quem faz a requisição, então não serve de chave.
 *
 * Sem o cabeçalho (rodando no computador, ou fora do Render) devolve `null`,
 * e quem chama deve deixar passar em vez de agrupar todos numa chave só.
 */
export function ipDoCliente(headers: Headers): string | null {
  const ip = headers.get("cf-connecting-ip")?.trim();
  return ip ? ip.slice(0, 64) : null;
}
