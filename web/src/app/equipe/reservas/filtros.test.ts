import { describe, expect, it } from "vitest";
import { consultaDoFiltro, hrefReservas, lerFiltro } from "./filtros";

describe("filtros da lista", () => {
  it("ignora página inválida e guarda o restante", () => {
    expect(lerFiltro({ busca: " Ana ", pagina: "0", status: "aceita" })).toEqual({
      busca: "Ana",
      escola: "",
      canal: "",
      status: "aceita",
      kit: "",
      entrega: "",
      pagina: 1,
    });
  });

  it("monta o link sem página na primeira e com página nas seguintes", () => {
    const filtro = lerFiltro({ escola: "EMEB", pagina: "2" });
    expect(hrefReservas(filtro)).toBe("/equipe/reservas?escola=EMEB&pagina=2");
    expect(consultaDoFiltro({ ...filtro, pagina: 1 })).toBe("escola=EMEB");
  });
});
