import { ESCOLAS_JUNDIAI } from "@/data/escolas";

function limpar(entrada: string) {
  return entrada
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buscarEscolas(termo: string, limite = 10) {
  const consulta = limpar(termo);
  if (consulta.length < 2) return { escolas: [] as string[], restantes: 0 };
  const todas = ESCOLAS_JUNDIAI.filter((nome) => limpar(nome).includes(consulta));
  return {
    escolas: todas.slice(0, limite),
    restantes: Math.max(0, todas.length - limite),
  };
}

export function escolaValida(nome: string) {
  return (ESCOLAS_JUNDIAI as readonly string[]).includes(nome);
}
