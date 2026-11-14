import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTO_FILA } from "@/lib/whatsapp/atendimento";
import { TEXTO_SEM_CONFIRMACAO } from "@/lib/whatsapp/ia/regras";

type Enviada = { tipo: string; texto: string; opcoes: { id: string; titulo: string }[] };

const simulado = vi.hoisted(() => ({
  enviadas: [] as Enviada[],
  conversas: new Map<string, { passo: string; dados: Record<string, unknown> }>(),
  fila: false,
  pediuPessoa: false,
  completar: vi.fn(),
  abrirFila: vi.fn(),
}));

vi.mock("@/lib/whatsapp/enviar", () => ({
  enviarTexto: async (_destino: string, texto: string) => {
    simulado.enviadas.push({ tipo: "texto", texto, opcoes: [] });
  },
  enviarBotoes: async (_destino: string, texto: string, botoes: Enviada["opcoes"]) => {
    expect(texto.length).toBeLessThanOrEqual(1024);
    expect(botoes.every((botao) => botao.titulo.length <= 20)).toBe(true);
    simulado.enviadas.push({ tipo: "botoes", texto, opcoes: botoes });
  },
  enviarLista: async () => undefined,
  enviarImagem: async () => undefined,
  enviarTemplate: async () => undefined,
}));

vi.mock("@/lib/whatsapp/conversa", () => ({
  carregarConversa: async (waId: string) => ({
    waId,
    perfilId: null,
    ...(simulado.conversas.get(waId) ?? { passo: "inicio", dados: {} }),
  }),
  salvarConversa: async (waId: string, patch: { passo: string; dados: Record<string, unknown> }) => {
    simulado.conversas.set(waId, patch);
  },
}));

vi.mock("@/lib/whatsapp/atendimento", () => ({
  TEXTO_FILA:
    "Sua conversa entrou na fila da equipe. Pode deixar sua dúvida por aqui. Se você estava reservando, suas escolhas continuam salvas.",
  registrarEntrada: async (_entrada: unknown, pediuPessoa: boolean) => {
    simulado.pediuPessoa = pediuPessoa;
    if (simulado.fila) return "humano";
    if (!pediuPessoa) return "bot";
    simulado.fila = true;
    return "novo";
  },
  abrirFila: (...args: unknown[]) => {
    simulado.fila = true;
    return simulado.abrirFila(...args);
  },
}));

vi.mock("@/lib/whatsapp/identidade", () => ({ perfilPorWaId: async () => null }));
vi.mock("@/lib/whatsapp/ia/base", () => ({
  lerBaseBot: async () => ({
    texto: "Retirada na loja, de segunda a sexta.",
    atualizadoEm: null,
    autor: "",
  }),
}));
vi.mock("@/lib/whatsapp/ia/claude", () => ({
  completar: (...args: unknown[]) => simulado.completar(...args),
}));

const { processarEntrada } = await import("@/lib/whatsapp/agente");

const WA = "5511999999999";
let contador = 0;

async function enviar(entrada: { texto?: string; escolha?: string }) {
  simulado.enviadas.length = 0;
  simulado.pediuPessoa = false;
  contador += 1;
  await processarEntrada({
    mensagemId: `ia${contador}`,
    waId: WA,
    nome: null,
    tipo: entrada.escolha ? "botao" : "texto",
    texto: entrada.texto ?? "",
    escolha: entrada.escolha ?? null,
    midiaId: null,
  });
  return [...simulado.enviadas];
}

beforeEach(() => {
  simulado.conversas.clear();
  simulado.fila = false;
  simulado.completar.mockReset();
  simulado.abrirFila.mockReset();
  simulado.abrirFila.mockResolvedValue(undefined);
});

describe("atendimento por IA", () => {
  it("abre o bot ao tocar em falar com atendente e não chama a fila", async () => {
    const resposta = await enviar({ escolha: "menu.atendente", texto: "Falar com atendente" });
    expect(simulado.pediuPessoa).toBe(false);
    expect(simulado.fila).toBe(false);
    expect(simulado.completar).not.toHaveBeenCalled();
    expect(resposta[0]?.texto).toContain("pré-reserva");
    expect(resposta[0]?.opcoes.map((opcao) => opcao.id)).toEqual(["menu.reservar", "ia.pessoa"]);
    expect(simulado.conversas.get(WA)?.passo).toBe("ia_atendimento");
  });

  it("responde com a base da loja e esconde afirmação de estoque", async () => {
    await enviar({ escolha: "menu.atendente", texto: "Falar com atendente" });
    simulado.completar.mockResolvedValueOnce({ texto: "A pré-reserva é gratuita.", consultou: false });
    const resposta = await enviar({ texto: "Como funciona a reserva?" });
    const sistema = simulado.completar.mock.calls[0][0].sistema as string;
    expect(sistema).toContain("Retirada na loja, de segunda a sexta.");
    expect(resposta[0]?.texto).toBe("A pré-reserva é gratuita.");

    simulado.completar.mockResolvedValueOnce({ texto: "Temos sim a camiseta tamanho 8.", consultou: true });
    expect((await enviar({ texto: "Tem camiseta manga curta tamanho 8?" }))[0]?.texto).toBe(TEXTO_SEM_CONFIRMACAO);
  });

  it("chama a equipe quando a IA falha e quando a pessoa pede alguém", async () => {
    await enviar({ escolha: "menu.atendente", texto: "Falar com atendente" });
    simulado.completar.mockRejectedValueOnce(new Error("rede"));
    expect((await enviar({ texto: "Qual o horário?" }))[0]?.texto).toBe(TEXTO_FILA);
    expect(simulado.abrirFila).toHaveBeenCalledOnce();
    expect(await enviar({ texto: "oi" })).toEqual([]);

    simulado.fila = false;
    simulado.conversas.clear();
    expect((await enviar({ texto: "quero falar com uma pessoa" }))[0]?.texto).toBe(TEXTO_FILA);
    expect(simulado.pediuPessoa).toBe(true);
  });
});
