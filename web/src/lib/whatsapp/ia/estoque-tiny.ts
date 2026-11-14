/**
 * Estoque da loja fica no Tiny.
 * Sem o token da API, esta consulta não afirma se a peça existe.
 */
export function consultarEstoqueTiny() {
  return {
    situacao: "confirmar" as const,
    texto: "A loja ainda não confirma esta peça neste tamanho. Diga isso e pergunte se a pessoa quer aviso neste WhatsApp quando a equipe confirmar. Não diga que tem nem que não tem.",
  };
}
