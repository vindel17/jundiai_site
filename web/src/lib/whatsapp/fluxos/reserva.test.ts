import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ESCOLAS_JUNDIAI } from "@/data/escolas";
import { pecasDoKit } from "@/lib/reserva/kit";
import { textoMedidas } from "@/lib/reserva/medidas";

type Enviada = {
  tipo: "texto" | "botoes" | "lista" | "imagem";
  texto: string;
  opcoes: { id: string; titulo: string; descricao?: string }[];
};

const simulado = vi.hoisted(() => ({
  enviadas: [] as Enviada[],
  conversas: new Map<string, { passo: string; dados: Record<string, unknown> }>(),
  gravar: vi.fn(),
}));

vi.mock("@/lib/whatsapp/enviar", () => {
  const registrar = (mensagem: Enviada) => {
    if (mensagem.tipo === "botoes" || mensagem.tipo === "lista") {
      expect(mensagem.texto.length).toBeLessThanOrEqual(1024);
    }
    simulado.enviadas.push(mensagem);
  };
  return {
    enviarTexto: async (_destino: string, texto: string) =>
      registrar({ tipo: "texto", texto, opcoes: [] }),
    enviarBotoes: async (_destino: string, texto: string, botoes: Enviada["opcoes"]) =>
      registrar({ tipo: "botoes", texto, opcoes: botoes }),
    enviarLista: async (_d: string, texto: string, _b: string, itens: Enviada["opcoes"]) =>
      registrar({ tipo: "lista", texto, opcoes: itens }),
    enviarImagem: async (_destino: string, url: string, legenda = "") =>
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
  salvarConversa: async (
    waId: string,
    patch: { passo: string; dados: Record<string, unknown> },
  ) => {
    simulado.conversas.set(waId, { passo: patch.passo, dados: patch.dados });
  },
}));

vi.mock("@/lib/whatsapp/identidade", () => ({ perfilPorWaId: async () => null }));
vi.mock("@/lib/reserva/gravar", () => ({ gravarReserva: simulado.gravar }));

const { processarEntrada } = await import("@/lib/whatsapp/agente");

const WA = "5511987654321";
const ESCOLA = ESCOLAS_JUNDIAI[0];
let contador = 0;

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
const titulos = (mensagem: Enviada) => mensagem.opcoes.map((opcao) => opcao.titulo);
const passo = () => simulado.conversas.get(WA)?.passo;

async function ateOModo() {
  await enviar({ texto: "reservar" });
  const lista = ultima(await enviar({ texto: ESCOLA }));
  const opcao = lista.opcoes.find((item) => item.descricao === ESCOLA.slice(0, 72));
  await enviar({ escolha: opcao?.id });
  await enviar({ texto: "lucas." });
  return enviar({ escolha: "reserva.kit.masculino" });
}

async function ateORevisar() {
  await ateOModo();
  await enviar({ escolha: "reserva.modo.unico" });
  return enviar({ escolha: "tam.8" });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-20T12:00:00-03:00"));
  simulado.conversas.clear();
  simulado.gravar.mockReset();
  simulado.gravar.mockResolvedValue({ id: "r1", codigoIndicacao: "abcd1234" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("pré-reserva pelo WhatsApp", () => {
  it("pede escola e nome, mostra os kits e usa o nome informado", async () => {
    const inicio = await enviar({ texto: "reservar" });
    expect(inicio[0].texto).toContain("não obriga a compra");
    expect(ultima(inicio).texto).toContain("nome da escola do(a) aluno(a)");

    const lista = ultima(await enviar({ texto: ESCOLA }));
    expect(lista.tipo).toBe("lista");
    const opcao = lista.opcoes.find((item) => item.descricao === ESCOLA.slice(0, 72));

    const nome = await enviar({ escolha: opcao?.id });
    expect(ultima(nome).texto).toBe("Qual é o primeiro nome do(a) aluno(a)?");

    const kits = await enviar({ texto: "lucas." });
    const textos = kits.map((mensagem) => mensagem.texto).join("\n");
    expect(textos).toContain("cada uma com 6 peças");
    expect(textos).toContain("Kit com bermuda");
    expect(textos).toContain("1 short-saia, 1 calça e 1 blusa de frio");
    const fotos = kits.filter((mensagem) => mensagem.tipo === "imagem").map((mensagem) => mensagem.texto);
    expect(fotos.join("\n")).toContain("/produtos/camiseta-manga-curta.jpg");
    expect(fotos.join("\n")).toContain("/produtos/bermuda.jpg");
    expect(fotos.join("\n")).toContain("/produtos/short-saia.jpg");
    expect(fotos.join("\n")).toContain("/produtos/blusa.jpg");
    expect(fotos).toHaveLength(6);
    expect(ultima(kits).texto).toContain("Qual opção você deseja para Lucas?");
    expect(titulos(ultima(kits))).toEqual(["Com bermuda", "Com short-saia"]);

    const modo = ultima(await enviar({ escolha: "reserva.kit.masculino" }));
    expect(modo.texto).toBe("Como prefere escolher os tamanhos?");
    expect(titulos(modo)).toEqual(["Um tamanho para tudo", "Escolher por peça", "Ajuda com medidas"]);
  });

  it("um tamanho para tudo vai ao resumo e confirma sem pagamento, com link", async () => {
    const resumo = ultima(await ateORevisar());
    expect(resumo.texto).toContain("Confira a pré-reserva de Lucas");
    expect(resumo.texto).toContain("Camiseta manga curta (2 peças): 8");
    expect(resumo.texto).toContain("Bermuda: 8");
    expect(resumo.texto).toContain("não tem pagamento agora e não obriga a compra");

    const fim = await enviar({ escolha: "reserva.confirma" });
    expect(simulado.gravar).toHaveBeenCalledWith(
      expect.objectContaining({
        aluno: "Lucas",
        escola: ESCOLA,
        kit: "masculino",
        tamanhos: { curta: "8", longa: "8", inferior: "8", calca: "8", blusa: "8" },
      }),
    );
    expect(fim[0].texto).toContain("Pré-reserva de Lucas confirmada");
    expect(fim[0].texto).toContain("/i/abcd1234");
    expect(titulos(ultima(fim))).toEqual(["Adicionar aluno(a)", "Concluir"]);
  });

  it("não confirma se a gravação falhar e permite tentar novamente", async () => {
    await ateORevisar();
    const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      simulado.gravar.mockRejectedValueOnce(new Error("banco indisponível"));
      const falha = await enviar({ escolha: "reserva.confirma" });
      expect(falha[0].texto).toContain("Não consegui anotar");
      expect(falha.map((m) => m.texto).join("\n")).not.toContain("confirmada!");
      expect(passo()).toBe("reserva_confirma");
      const sucesso = await enviar({ escolha: "reserva.confirma" });
      expect(sucesso[0].texto).toContain("Pré-reserva de Lucas confirmada");
    } finally {
      erro.mockRestore();
    }
  });

  it("por peça mostra só medidas conferidas na lista de tamanhos", async () => {
    await ateOModo();
    const curta = ultima(await enviar({ escolha: "reserva.modo.peca" }));
    const descricao = (tamanho: string) =>
      curta.opcoes.find((opcao) => opcao.id === `tam.${tamanho}`)?.descricao;
    expect(ids(curta)).toEqual([
      "tam.4", "tam.6", "tam.8", "tam.10", "tam.12", "tam.14", "tam.P", "tam.M", "tam.G", "tam.GG",
    ]);
    expect(descricao("4")).toBe("Comprimento 45 cm, largura do corpo 35 cm");
    expect(descricao("10")).toBe("Comprimento 57 cm, largura do corpo 41 cm");
    expect(descricao("GG")).toBe("Comprimento 81 cm, largura do corpo 61 cm");

    const longa = ultima(await enviar({ escolha: "tam.6" }));
    expect(longa.opcoes.find((opcao) => opcao.id === "tam.14")?.descricao).toBe(
      "Comprimento 65 cm, largura do corpo 45 cm",
    );

    const bermuda = ultima(await enviar({ escolha: "tam.8" }));
    expect(bermuda.opcoes.find((opcao) => opcao.id === "tam.4")?.descricao).toBe(
      "Cintura com elástico relaxado 22 cm, quadril 34 cm",
    );
    const calca = ultima(await enviar({ escolha: "tam.8" }));
    expect(calca.opcoes.find((opcao) => opcao.id === "tam.GG")?.descricao).toBe(
      "Cintura com elástico relaxado 40 cm, quadril 60 cm",
    );
    const blusa = ultima(await enviar({ escolha: "tam.10" }));
    expect(blusa.opcoes.find((opcao) => opcao.id === "tam.P")?.descricao).toBe(
      "Comprimento da frente 70 cm, largura do corpo 50 cm",
    );
    const resumo = ultima(await enviar({ escolha: "tam.12" }));
    expect(resumo.texto).toContain("Camiseta manga curta (2 peças): 6");
    expect(resumo.texto).toContain("Blusa de frio: 12");
  });

  it("ajuda com medidas separa medida conferida de medida em conferência", async () => {
    await ateOModo();
    const pecas = ultima(await enviar({ escolha: "reserva.modo.ajuda" }));
    expect(ids(pecas)).toContain("reserva.ajuda.curta");

    const curta = (await enviar({ escolha: "reserva.ajuda.curta" })).find((m) => m.tipo === "texto")!;
    expect(curta.texto).toContain("Tamanho 6: comprimento 49 cm, largura do corpo 37 cm");
    expect(curta.texto).toContain("Tamanho GG: comprimento 81 cm, largura do corpo 61 cm");
    expect(curta.texto).not.toContain("conferência");

    await enviar({ escolha: "reserva.ajuda_outra" });
    const calca = (await enviar({ escolha: "reserva.ajuda.calca" })).find((m) => m.tipo === "texto")!;
    expect(calca.texto).toContain("Tamanho 4: cintura com elástico relaxado 22 cm, quadril 34 cm");
    expect(calca.texto).toContain("Tamanho M: cintura com elástico relaxado 36 cm, quadril 52 cm");

    const saia = textoMedidas(pecasDoKit("feminino")[2]);
    expect(saia).toContain("ainda estão em conferência");
    expect(saia).not.toMatch(/\d+ cm/);

    const modo = ultima(await enviar({ escolha: "reserva.ajuda_fim" }));
    expect(modo.texto).toBe("Como prefere escolher os tamanhos?");
  });

  it("corrige só o campo escolhido e volta ao resumo", async () => {
    await ateORevisar();
    const campos = ultima(await enviar({ escolha: "reserva.corrigir" }));
    expect(ids(campos)).toEqual(
      expect.arrayContaining(["reserva.cor.escola", "reserva.cor.aluno", "reserva.cor.calca"]),
    );

    await enviar({ escolha: "reserva.cor.calca" });
    const resumo = ultima(await enviar({ escolha: "tam.10" }));
    expect(passo()).toBe("reserva_confirma");
    expect(resumo.texto).toContain("Calça: 10");
    expect(resumo.texto).toContain("Bermuda: 8");

    await enviar({ escolha: "reserva.corrigir" });
    await enviar({ escolha: "reserva.cor.aluno" });
    const novoNome = ultima(await enviar({ texto: "Ana Clara" }));
    expect(novoNome.texto).toContain("Confira a pré-reserva de Ana Clara");
    expect(novoNome.texto).toContain("Calça: 10");
  });

  it("continua de onde parou depois de sair para o menu", async () => {
    await ateOModo();
    await enviar({ texto: "menu" });
    expect(passo()).toBe("menu");

    const pergunta = ultima(await enviar({ texto: "reservar" }));
    expect(pergunta.texto).toContain("pré-reserva para Lucas");
    expect(titulos(pergunta)).toEqual(["Continuar", "Começar de novo"]);

    const retomada = ultima(await enviar({ escolha: "reserva.retomar" }));
    expect(retomada.texto).toBe("Como prefere escolher os tamanhos?");
    await enviar({ escolha: "reserva.modo.unico" });
    const resumo = ultima(await enviar({ escolha: "tam.4" }));
    expect(resumo.texto).toContain(`Escola: ${ESCOLA}`);
  });

  it("adiciona outro(a) aluno(a) na mesma escola sem repetir o link", async () => {
    await ateORevisar();
    await enviar({ escolha: "reserva.confirma" });
    const escola = ultima(await enviar({ escolha: "reserva.outro.sim" }));
    expect(titulos(escola)).toEqual(["Mesma escola", "Outra escola"]);

    await enviar({ escolha: "reserva.escola.mesma" });
    await enviar({ texto: "Maria" });
    await enviar({ escolha: "reserva.kit.feminino" });
    await enviar({ escolha: "reserva.modo.unico" });
    const resumo = ultima(await enviar({ escolha: "tam.6" }));
    expect(resumo.texto).toContain("Short-saia: 6");

    const fim = await enviar({ escolha: "reserva.confirma" });
    expect(simulado.gravar).toHaveBeenLastCalledWith(
      expect.objectContaining({ aluno: "Maria", escola: ESCOLA, kit: "feminino" }),
    );
    expect(fim[0].texto).not.toContain("/i/abcd1234");
  });
});
