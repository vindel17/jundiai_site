import { CATALOGO } from "@/data/catalogo";

export const DOACAO_MODELOS = CATALOGO.map((item) => ({
  id: item.id,
  name: item.name,
}));

export function nomeDoModelo(modeloId: string) {
  return DOACAO_MODELOS.find((m) => m.id === modeloId)?.name ?? "Peça";
}

export function qsReceber(atual: FiltroReceber, patch: Partial<FiltroReceber>) {
  const merged = { ...atual, ...patch };
  const params = new URLSearchParams();
  if (merged.modelo) params.set("modelo", merged.modelo);
  if (merged.tamanho) params.set("tamanho", merged.tamanho);
  if (merged.escola) params.set("escola", merged.escola);
  const qs = params.toString();
  return qs ? `/doacao/receber?${qs}` : "/doacao/receber";
}

export type FiltroReceber = {
  modelo?: string;
  tamanho?: string;
  escola?: string;
};
