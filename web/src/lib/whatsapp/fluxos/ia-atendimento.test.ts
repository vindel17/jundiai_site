import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEXTO_FILA } from "@/lib/whatsapp/atendimento";
import { comandoDeMenu, escolheuIa, pediuPessoa } from "@/lib/whatsapp/intencao";
import { TEXTO_SEM_CONFIRMACAO } from "@/lib/whatsapp/ia/regras";

type Enviada = { tipo: string; texto: string; opcoes: { id: string; titulo: string }[] };
type Executar = (nome: string, entrada: Record<string, unknown>) => Promise<string>;

const simulado = vi.hoisted(() => ({
  enviadas: [] as Enviada[],
  conversas: new Map<string, { passo: string; dados: Record<string, unknown> }>(),
  fila: "nenhuma" as "nenhuma" | "aberta" | "assumida",
  pediuPessoa: false,
  completar: vi.fn(),
  abrirFila: vi.fn(),
  respostasBot: [] as string[],
  avisos: [] as string[],
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
  enviarLista: async (_destino: string, texto: string, _botao: string, itens: Enviada["opcoes"]) => {
    simulado.enviadas.push({ tipo: "lista", texto, opcoes: itens });
  },
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
    if (simulado.fila === "assumida") return "humano";
    if (simulado.fila === "aberta") return "fila";
    if (!pediuPessoa) return "bot";
    simulado.fila = "aberta";
    return "novo";
  },
  abrirFila: async (...args: unknown[]) => {
    simulado.fila = "aberta";
    return simulado.abrirFila(...args);
  },
  registrarRespostaBot: async (_waId: string, texto: string) => {
    simulado.respostasBot.push(texto);
  },
}));

vi.mock("@/lib/whatsapp/identidade", () => ({ perfilPorWaId: async () => null }));
vi.mock("@/lib/whatsapp/fila-aviso", () => ({
  avisarFila: async (_waId: string, texto: string) => {
    simulado.avisos.push(texto);
  },
}));
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

const passo = () => simulado.conversas.get(WA)?.passo;

function sistemaDaChamada(indice = 0) {
  return simulado.completar.mock.calls[indice][0].sistema as string;
}

beforeEach(() => {
  simulado.conversas.clear();
  simulado.fila = "nenhuma";
  simulado.respostasBot.length = 0;
  simulado.avisos.length = 0;
  simulado.completar.mockReset();
  simulado.abrirFila.mockReset();
  simulado.abrirFila.mockResolvedValue("novo");
});

describe("pedido de atendimento", () => {
  it("separa pedido genérico de pedido por uma pessoa", () => {
    expect(escolheuIa(null, "atendente")).toBe(true);
    expect(escolheuIa(null, "Quero falar com um atendente")).toBe(true);
    expect(pediuPessoa(null, "quero falar com um atendente")).toBe(false);
    expect(pediuPessoa(null, "quero falar com uma pessoa")).toBe(true);
    expect(pediuPessoa(null, "humano")).toBe(true);
    expect(pediuPessoa("ia.pessoa", "Falar com pessoa")).toBe(true);
    expect(pediuPessoa("menu.atendente", "Falar com atendente")).toBe(false);
  });

  it("abre o Haiku pelo botão do menu e pelo texto genérico, sem chamar a fila", async () => {
    const botao = await enviar({ escolha: "menu.atendente", texto: "Falar com atendente" });
    expect(simulado.fila).toBe("nenhuma");
    expect(botao[0]?.opcoes.map((opcao) => opcao.id)).toEqual(["menu.reservar", "ia.pessoa"]);

    simulado.conversas.clear();
    const texto = await enviar({ texto: "quero falar com um atendente" });
    expect(simulado.fila).toBe("nenhuma");
    expect(texto[0]?.texto).toContain("pré-reserva");
    expect(simulado.conversas.get(WA)?.passo).toBe("ia_atendimento");
    expect(simulado.completar).not.toHaveBeenCalled();
  });

  it("manda para a IA a pergunta que o bot inicial não entende", async () => {
    simulado.completar.mockResolvedValueOnce({ texto: "A data ainda não foi confirmada.", consultou: false });
    const resposta = await enviar({ texto: "Quando sai o voucher?" });
    expect(resposta.map((mensagem) => mensagem.texto)).toEqual(["A data ainda não foi confirmada."]);
    expect(passo()).toBe("ia_atendimento");
    expect(simulado.fila).toBe("nenhuma");
  });

  it("mostra o menu para cumprimento, texto pronto do site e mensagem sem texto", async () => {
    for (const texto of [
      "oi",
      "Bom dia!",
      "boa tarde",
      "",
      "Olá! Quero ajuda com o uniforme escolar em Jundiaí.",
      "Quero separar o uniforme do meu filho",
    ]) {
      simulado.conversas.clear();
      expect((await enviar({ texto }))[0]?.tipo).toBe("lista");
      expect(passo()).toBe("menu");
    }
    expect(simulado.completar).not.toHaveBeenCalled();
  });

  it("na IA, pergunta que cita benefício ou uniforme novo não muda de fluxo", async () => {
    await enviar({ texto: "atendente" });
    simulado.completar.mockResolvedValue({ texto: "É um programa da Prefeitura.", consultou: false });
    for (const texto of [
      "O voucher é um benefício da Prefeitura?",
      "Meu filho precisa de uniforme novo, como funciona o voucher?",
    ]) {
      expect((await enviar({ texto }))[0]?.texto).toBe("É um programa da Prefeitura.");
      expect(passo()).toBe("ia_atendimento");
    }
    expect(simulado.completar).toHaveBeenCalledTimes(2);

    expect(comandoDeMenu("Meus benefícios")).toBe(true);
    await enviar({ texto: "comprar" });
    expect(passo()).toBe("compra_peca");
    expect(simulado.completar).toHaveBeenCalledTimes(2);
  });
});

describe("atendimento por IA", () => {
  it("responde com a base da loja e esconde afirmação de estoque", async () => {
    await enviar({ texto: "atendente" });
    simulado.completar.mockResolvedValueOnce({ texto: "A pré-reserva é gratuita.", consultou: false });
    const resposta = await enviar({ texto: "Como funciona a reserva?" });
    expect(sistemaDaChamada()).toContain("Retirada na loja, de segunda a sexta.");
    expect(resposta[0]?.texto).toBe("A pré-reserva é gratuita.");

    simulado.completar.mockResolvedValueOnce({ texto: "Temos sim a camiseta tamanho 8.", consultou: true });
    expect((await enviar({ texto: "Tem camiseta manga curta tamanho 8?" }))[0]?.texto).toBe(TEXTO_SEM_CONFIRMACAO);
  });

  it("chama a equipe quando o Haiku não sabe responder pela base", async () => {
    await enviar({ texto: "atendente" });
    simulado.completar.mockImplementationOnce(async ({ executar }: { executar: Executar }) => {
      await executar("chamar_equipe", { motivo: "horário de domingo" });
      return { texto: "Vou chamar alguém da loja para responder por aqui.", consultou: false };
    });
    const resposta = await enviar({ texto: "A loja abre domingo?" });
    expect(simulado.abrirFila).toHaveBeenCalledOnce();
    expect(simulado.abrirFila.mock.calls[0][2]).toBe("A loja abre domingo?");
    expect(resposta[0]?.texto).toBe("Vou chamar alguém da loja para responder por aqui.");
    expect(simulado.respostasBot).toEqual(["Vou chamar alguém da loja para responder por aqui."]);
    expect(simulado.avisos).toEqual(["A loja abre domingo?"]);
  });

  it("continua respondendo na fila sem dono, sem repetir que a equipe foi chamada", async () => {
    expect((await enviar({ texto: "quero falar com uma pessoa" }))[0]?.texto).toBe(TEXTO_FILA);
    expect(simulado.avisos).toEqual(["quero falar com uma pessoa"]);
    expect(simulado.completar).not.toHaveBeenCalled();

    simulado.completar.mockResolvedValueOnce({ texto: "A pré-reserva é gratuita.", consultou: false });
    const resposta = await enviar({ texto: "Precisa pagar para reservar?" });
    expect(sistemaDaChamada()).toContain("Não diga que a equipe foi chamada");
    expect(resposta[0]?.texto).toBe("A pré-reserva é gratuita.");
    expect(simulado.respostasBot).toEqual(["A pré-reserva é gratuita."]);

    simulado.fila = "assumida";
    expect(await enviar({ texto: "oi" })).toEqual([]);
    expect(simulado.completar).toHaveBeenCalledOnce();
  });

  it("na fila sem dono, menu e reserva continuam funcionando", async () => {
    await enviar({ texto: "quero falar com uma pessoa" });

    expect((await enviar({ texto: "menu" }))[0]?.tipo).toBe("lista");
    await enviar({ escolha: "menu.reservar", texto: "Reservar uniforme" });
    expect(passo()).toMatch(/^reserva_/);
    expect(simulado.completar).not.toHaveBeenCalled();
    expect(simulado.fila).toBe("aberta");
  });

  it("na fila sem dono, repete o aviso só para quem pede uma pessoa de novo", async () => {
    await enviar({ texto: "quero falar com uma pessoa" });
    expect((await enviar({ escolha: "ia.pessoa", texto: "Falar com pessoa" })).map((m) => m.texto)).toEqual([TEXTO_FILA]);
    expect(simulado.completar).not.toHaveBeenCalled();

    simulado.completar.mockRejectedValue(new Error("rede"));
    expect(await enviar({ texto: "Qual o horário?" })).toEqual([]);
    expect(await enviar({ texto: "E no sábado?" })).toEqual([]);
    expect(simulado.abrirFila).not.toHaveBeenCalled();
    expect(simulado.avisos).toEqual(["quero falar com uma pessoa"]);
  });

  it("chama a equipe quando a IA falha", async () => {
    await enviar({ texto: "atendente" });
    simulado.completar.mockRejectedValueOnce(new Error("rede"));
    expect((await enviar({ texto: "Qual o horário?" }))[0]?.texto).toBe(TEXTO_FILA);
    expect(simulado.abrirFila).toHaveBeenCalledOnce();
    expect(simulado.avisos).toEqual(["Qual o horário?"]);
  });
});
