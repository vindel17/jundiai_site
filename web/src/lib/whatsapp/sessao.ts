export type Sessao = {
  waId: string;
  perfilId: string | null;
  passo: string;
  dados: Record<string, unknown>;
};

export type ResultadoTurno = {
  passo: string;
  dados: Record<string, unknown>;
  perfilId?: string | null;
};

export function dadoTexto(dados: Record<string, unknown>, chave: string) {
  const valor = dados[chave];
  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}
