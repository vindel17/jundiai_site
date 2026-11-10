import { describe, expect, it } from "vitest";
import { pseudonimo } from "./anonimo";
import { etapasDoTurno } from "./etapas";
import { formatarPorcentagem, funilPorOrigem, montarFunil, type LinhaFunil } from "./funil";
import { lerCookieOrigem, origemDoSite, temOrigem, textoCookieOrigem } from "./origem-site";

describe("etapas do turno no WhatsApp", () => {
  it("qualquer mensagem conta como contato", () => {
    expect(etapasDoTurno("menu", {})).toEqual(["contato"]);
    expect(etapasDoTurno("compra_modelo", { escola: "X" })).toEqual(["contato"]);
  });

  it("começar a reservar ainda não escolheu escola nem kit", () => {
    expect(etapasDoTurno("reserva_escola", {})).toEqual(["contato", "reserva_iniciada"]);
  });

  it("escola e kit entram quando estão nos dados", () => {
    expect(etapasDoTurno("reserva_nome", { escola: "Ivo de Bona EMEB" })).toEqual([
      "contato",
      "reserva_iniciada",
      "escola",
    ]);
    expect(etapasDoTurno("reserva_modo", { escola: "Ivo", kit: "masculino" })).toEqual([
      "contato",
      "reserva_iniciada",
      "escola",
      "kit",
    ]);
  });

  it("o resumo e a confirmação trazem os degraus anteriores juntos", () => {
    expect(etapasDoTurno("reserva_confirma", { escola: "Ivo", kit: "feminino" })).toEqual([
      "contato",
      "reserva_iniciada",
      "escola",
      "kit",
      "resumo",
    ]);
    expect(etapasDoTurno("reserva_outro", {})).toEqual([
      "contato",
      "reserva_iniciada",
      "escola",
      "kit",
      "resumo",
      "confirmada",
    ]);
  });

  it("escola vazia não conta", () => {
    expect(etapasDoTurno("reserva_escola", { escola: "  " })).toEqual(["contato", "reserva_iniciada"]);
  });
});

describe("pseudônimo", () => {
  it("é estável, não devolve o telefone e muda com o segredo", () => {
    const a = pseudonimo("5511987654321", "segredo-a");
    expect(a).toBe(pseudonimo("5511987654321", "segredo-a"));
    expect(a).not.toContain("5511987654321");
    expect(a).toHaveLength(32);
    expect(a).not.toBe(pseudonimo("5511987654321", "segredo-b"));
    expect(a).not.toBe(pseudonimo("5511987654322", "segredo-a"));
  });
});

describe("origem do site", () => {
  it("usa ?origem= quando é um canal conhecido", () => {
    expect(origemDoSite({ origem: "Panfleto", utmCampaign: "JDI-042" })).toEqual({
      canal: "panfleto",
      codigo: "JDI-042",
    });
  });

  it("utm_medium pago vira tráfego pago e outra fonte vira rede social", () => {
    expect(origemDoSite({ utmSource: "facebook", utmMedium: "cpc", utmCampaign: "meta-01" })).toEqual({
      canal: "pago",
      codigo: "meta-01",
    });
    expect(origemDoSite({ utmSource: "instagram", utmMedium: "bio" }).canal).toBe("social");
  });

  it("sem parâmetro é direto", () => {
    expect(temOrigem({})).toBe(false);
    expect(temOrigem({ utmSource: " " })).toBe(false);
    expect(origemDoSite({})).toEqual({ canal: "direto", codigo: "" });
  });

  it("o cookie guarda e devolve a origem, e ignora valor adulterado", () => {
    const texto = textoCookieOrigem({ canal: "pago", codigo: "meta-01" });
    expect(lerCookieOrigem(texto)).toEqual({ canal: "pago", codigo: "meta-01" });
    expect(lerCookieOrigem("hackeado|x")).toEqual({ canal: "direto", codigo: "" });
    expect(lerCookieOrigem(undefined)).toEqual({ canal: "direto", codigo: "" });
  });
});

const linha = (
  canal: LinhaFunil["canal"],
  etapa: string,
  origem_canal: LinhaFunil["origem_canal"],
  pessoas: number,
): LinhaFunil => ({ canal, etapa, origem_canal, pessoas });

const LINHAS: LinhaFunil[] = [
  linha("whatsapp", "contato", "direto", 60),
  linha("whatsapp", "contato", "panfleto", 40),
  linha("whatsapp", "reserva_iniciada", "direto", 30),
  linha("whatsapp", "reserva_iniciada", "panfleto", 30),
  linha("whatsapp", "escola", "direto", 25),
  linha("whatsapp", "escola", "panfleto", 25),
  linha("whatsapp", "kit", "direto", 20),
  linha("whatsapp", "kit", "panfleto", 20),
  linha("whatsapp", "resumo", "direto", 15),
  linha("whatsapp", "resumo", "panfleto", 15),
  linha("whatsapp", "confirmada", "direto", 5),
  linha("whatsapp", "confirmada", "panfleto", 25),
  linha("site", "visita_site", "direto", 200),
  linha("site", "clique_whatsapp", "direto", 40),
];

describe("funil", () => {
  it("soma as origens e calcula os percentuais", () => {
    const { passos, maiorPerda } = montarFunil(LINHAS, "whatsapp");
    expect(passos.map((passo) => passo.pessoas)).toEqual([100, 60, 50, 40, 30, 30]);
    expect(passos[0].doAnterior).toBeNull();
    expect(passos[1]).toMatchObject({ doAnterior: 60, doInicio: 60 });
    expect(passos[5]).toMatchObject({ doAnterior: 100, doInicio: 30 });
    expect(maiorPerda).toMatchObject({
      de: "Chamaram no WhatsApp",
      para: "Começaram a reservar",
      seguem: 60,
    });
  });

  it("mostra a ação do site que fica fora da sequência", () => {
    const { passos, extras } = montarFunil(LINHAS, "site");
    expect(passos.map((passo) => passo.pessoas)).toEqual([200, 0, 0]);
    expect(extras).toEqual([
      { etapa: "clique_whatsapp", rotulo: "Clicaram para falar no WhatsApp", pessoas: 40 },
    ]);
  });

  it("separa por origem, com conversão do início ao fim", () => {
    const origens = funilPorOrigem(LINHAS, "whatsapp");
    expect(origens.map((o) => o.origem)).toEqual(["panfleto", "direto"]);
    expect(origens[0]).toMatchObject({ pessoas: [40, 30, 25, 20, 15, 25], conversao: 62.5 });
    expect(origens[1].conversao).toBeCloseTo(8.33, 1);
  });

  it("sem registros, nada divide por zero", () => {
    const vazio = montarFunil([], "whatsapp");
    expect(vazio.passos.every((passo) => passo.pessoas === 0)).toBe(true);
    expect(vazio.passos[1].doAnterior).toBeNull();
    expect(vazio.maiorPerda).toBeNull();
    expect(funilPorOrigem([], "whatsapp")).toEqual([]);
  });

  it("formata em português e usa traço quando não há base", () => {
    expect(formatarPorcentagem(62.5)).toBe("62,5%");
    expect(formatarPorcentagem(null)).toBe("—");
  });
});
