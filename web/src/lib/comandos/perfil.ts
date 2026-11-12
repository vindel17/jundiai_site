/**
 * Comandos de perfil usados pela indicação e pelo registro de compra.
 */

import { certo, errado, type Executor, type Resultado } from "./tipos";

export type PlacarIndicacao = {
  codigo: string | null;
  acessos: number;
  cadastros: number;
  pendente_centavos: number;
  confirmado_centavos: number;
  camisetas: number;
  faltam_centavos: number;
  indicado: boolean;
};

export async function placarIndicacao(
  ex: Executor,
): Promise<Resultado<PlacarIndicacao | null>> {
  const { dados, erro } = await ex.rpc<PlacarIndicacao[]>("placar_indicacao");
  if (erro) return errado("Não conseguimos carregar seus benefícios agora.");
  return certo(dados?.[0] ?? null);
}

export async function registrarCompra(
  ex: Executor,
  valorCentavos: number,
): Promise<Resultado> {
  if (!Number.isInteger(valorCentavos) || valorCentavos < 100) {
    return errado("Valor inválido.");
  }

  const { erro } = await ex.rpc<string>("registrar_compra", {
    p_valor_centavos: valorCentavos,
  });
  if (erro) return errado("Não conseguimos registrar a compra agora.");

  return certo(null);
}
