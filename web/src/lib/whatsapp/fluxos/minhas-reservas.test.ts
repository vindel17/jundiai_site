import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReservaLinha } from "@/lib/reserva/consultas";

type Enviada = {
  tipo: "texto" | "botoes" | "lista" | "imagem";
  texto: string;
  opcoes: { id: string; titulo: string; descricao?: string }[];
};

const simulado = vi.hoisted(() => ({
  enviadas: [] as Enviada[],
  conversas: new Map<string, { passo: string; dados: Record<string, unknown> }>(),
  linhas: [] as ReservaLinha[],
  atualizar: vi.fn(),
}));

vi.mock("@/lib/whatsapp/enviar", () => {
  const registrar = (mensagem: Enviada) => {
    if (mensagem.tipo === "lista") expect(mensagem.opcoes.length).toBeLessThanOrEqual(10);
    simulado.enviadas.push(mensagem);
  };
  return {
    enviarTexto: async (_d: string, texto: string) => registrar({ tipo: "texto", texto, opcoes: [] }),
    enviarBotoes: async (_d: string, texto: string, botoes: Enviada["opcoes"]) =>
      registrar({ tipo: "botoes", texto, opcoes: botoes }),
    enviarLista: async (_d: string, texto: string, _b: string, itens: Enviada["opcoes"]) =>
      registrar({ tipo: "lista", texto, opcoes: itens }),
    enviarImagem: async (_d: string, url: string, legenda = "") =>
      registrar({ tipo: "imagem", texto: `${url}\n${legenda}`, opcoes: [] }),
    enviarTemplate: async () => undefined,
  };
});

vi.mock("@/lib/whatsapp/conversa", () => ({
  mensagemNova: async () => true,
  carregarConversa: async (waId: string) => ({
    waId,
    perfilId: null,
    ...(simulado.conversas.get(waId) ?? { passo: "inicio", dados: {} }),
  }),
  salvarConversa: async (waId: string, patch: { passo: string; dados: Record<string, unknown> }) => {
    simulado.conversas.set(waId, { passo: patch.passo, dados: patch.dados });
  },
}));

vi.mock("@/lib/whatsapp/identidade", () => ({ perfilPorWaId: async () => null }));
vi.mock("@/lib/reserva/consultas", () => ({
  listarReservasDoTelefone: async () => ({ linhas: simulado.linhas, codigo: "abcd1234" }),
  atualizarReserva: simulado.atualizar,
}));

const { processarEntrada } = await import("@/lib/whatsapp/agente");

const WA = "5511987654321";
let contador = 0;

function reserva(parcial: Partial<ReservaLinha>): ReservaLinha {
  return {
    id: "r1",
    telefone: WA,
    origemCanal: "direto",
    origemCodigo: "",
    escola: "EMEB Exemplo",
    aluno: "Lucas",
    kit: "masculino",
    tamanhos: { curta: "8", longa: "8", inferior: "8", calca: "8", blusa: "8" },
    entrega: "loja",
    status: "recebida",
    criadoEm: "2026-10-20T12:00:00-03:00",
    ...parcial,
  };
}

async function enviar(entrada: { texto?: string; escolha?: string }) {
  simulado.enviadas.length = 0;
  contador += 1;
  await processarEntrada({
    mensagemId: `m${contador}`,
    waId: WA,
    nome: null,
    tipo: entrada.escolha ? "botao" : "texto",
    texto: entrada.texto ?? "",
    escolha: entrada.escolha ?? null,
    midiaId: null,
  });
  return [...simulado.enviadas];
}

const ultima = (mensagens: Enviada[]) => mensagens[mensagens.length - 1];
const ids = (mensagem: Enviada) => mensagem.opcoes.map((opcao) => opcao.id);
const passo = () => simulado.conversas.get(WA)?.passo;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-20T12:00:00-03:00"));
  simulado.conversas.clear();
  simulado.linhas = [reserva({})];
  simulado.atualizar.mockReset();
  simulado.atualizar.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("minhas reservas pelo WhatsApp", () => {
  it("aparece no menu", async () => {
    const menu = ultima(await enviar({ texto: "oi" }));
    expect(ids(menu)).toContain("menu.minhas_reservas");
  });

  it("sem reserva no número, aponta para Reservar uniforme", async () => {
    simulado.linhas = [];
    const resposta = await enviar({ escolha: "menu.minhas_reservas" });
    expect(resposta[0].texto).toContain("Ainda não encontrei pré-reserva");
    expect(passo()).toBe("menu");
  });

  it("mostra a reserva e troca o tamanho da calça", async () => {
    const resposta = await enviar({ texto: "minhas reservas" });
    expect(resposta[0].texto).toContain("*Lucas* · EMEB Exemplo");
    expect(resposta[0].texto).toContain("Como receber: Retirar na loja");
    expect(ids(ultima(resposta))).toContain("minhas.c.calca");

    const tamanhos = ultima(await enviar({ escolha: "minhas.c.calca" }));
    expect(ids(tamanhos)).toContain("reserva.sem");
    const pronto = ultima(await enviar({ escolha: "tam.10" }));

    expect(simulado.atualizar).toHaveBeenCalledWith(
      "r1",
      { curta: "8", longa: "8", inferior: "8", calca: "10", blusa: "8" },
      "loja",
    );
    expect(pronto.texto).toContain("Calça: 10");
    expect(passo()).toBe("minhas_fim");
  });

  it("tira uma peça e passa a mostrar o frete da entrega em casa", async () => {
    simulado.linhas = [reserva({ entrega: "casa" })];
    await enviar({ escolha: "menu.minhas_reservas" });
    await enviar({ escolha: "minhas.c.blusa" });
    const pronto = ultima(await enviar({ escolha: "reserva.sem" }));
    expect(pronto.texto).toContain("Blusa de frio: sem esta peça");
    expect(pronto.texto).toContain("Receber em casa, com entrega de R$");
  });

  it("muda a forma de receber", async () => {
    await enviar({ escolha: "menu.minhas_reservas" });
    const pergunta = ultima(await enviar({ escolha: "minhas.c.entrega" }));
    expect(ids(pergunta)).toEqual(["reserva.entrega.casa", "reserva.entrega.loja"]);
    await enviar({ escolha: "reserva.entrega.casa" });
    expect(simulado.atualizar).toHaveBeenCalledWith("r1", expect.anything(), "casa");
  });

  it("com dois filhos, pergunta qual reserva ajustar", async () => {
    simulado.linhas = [reserva({}), reserva({ id: "r2", aluno: "Maria", kit: "feminino" })];
    const lista = ultima(await enviar({ escolha: "menu.minhas_reservas" }));
    expect(ids(lista)).toEqual(["minhas.r.0", "minhas.r.1", "minhas.fim"]);
    const campos = ultima(await enviar({ escolha: "minhas.r.1" }));
    expect(campos.texto).toContain("reserva de Maria");
    expect(ids(campos)).toContain("minhas.c.inferior");
  });

  it("não deixa a reserva sem nenhuma peça", async () => {
    simulado.linhas = [
      reserva({ tamanhos: { curta: null, longa: null, inferior: null, calca: null, blusa: "8" } }),
    ];
    await enviar({ escolha: "menu.minhas_reservas" });
    await enviar({ escolha: "minhas.c.blusa" });
    const resposta = await enviar({ texto: "não quero" });
    expect(resposta[0].texto).toContain("precisa de ao menos uma peça");
    expect(simulado.atualizar).not.toHaveBeenCalled();
  });

  it("reserva que a equipe já separou aparece, mas não abre ajuste", async () => {
    simulado.linhas = [reserva({ status: "separada" })];
    const resposta = await enviar({ escolha: "menu.minhas_reservas" });
    expect(resposta[0].texto).toContain("*Lucas*");
    expect(passo()).toBe("menu");
  });
});
