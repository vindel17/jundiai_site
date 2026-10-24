import type { FiltroReservas } from "@/lib/reserva/consultas";

type Bruto = {
  busca?: string;
  escola?: string;
  canal?: string;
  status?: string;
  kit?: string;
  entrega?: string;
  pagina?: string;
};

export function lerFiltro(params: Bruto): FiltroReservas {
  const pagina = Number(params.pagina);
  return {
    busca: params.busca?.trim() ?? "",
    escola: params.escola?.trim() ?? "",
    canal: params.canal ?? "",
    status: params.status ?? "",
    kit: params.kit ?? "",
    entrega: params.entrega ?? "",
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

export function hrefReservas(filtro: FiltroReservas) {
  const q = new URLSearchParams();
  const campos: [string, string][] = [
    ["busca", filtro.busca ?? ""],
    ["escola", filtro.escola ?? ""],
    ["canal", filtro.canal ?? ""],
    ["status", filtro.status ?? ""],
    ["kit", filtro.kit ?? ""],
    ["entrega", filtro.entrega ?? ""],
  ];
  for (const [chave, valor] of campos) if (valor) q.set(chave, valor);
  if ((filtro.pagina ?? 1) > 1) q.set("pagina", String(filtro.pagina));
  const texto = q.toString();
  return texto ? `/equipe/reservas?${texto}` : "/equipe/reservas";
}

export function consultaDoFiltro(filtro: FiltroReservas) {
  return hrefReservas(filtro).split("?")[1] ?? "";
}
