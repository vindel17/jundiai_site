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
  await enviar({ escolha: "tam.8" });
  return enviar({ escolha: "reserva.entrega.loja" });
}

const TAMANHOS_DA_LISTA = ["tam.4", "tam.6", "tam.8", "tam.10", "tam.12", "tam.14", "tam.P", "tam.M", "tam.G"];

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
    expect(inicio[0].texto.split("\n")[0]).toContain("antes de começar as aulas");
    expect(inicio[0].texto).toContain("não obriga a compra");
    expect(inicio[0].texto).toContain("é só deixar de fora");
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
    expect(textos).not.toContain("/produtos/camiseta-manga-curta.jpg");
    expect(kits).toHaveLength(4);
    expect(ultima(kits).texto).toContain("Qual opção você deseja para Lucas?");
    expect(titulos(ultima(kits))).toEqual(["Com bermuda", "Com short-saia"]);

    const modo = ultima(await enviar({ escolha: "reserva.kit.masculino" }));
    expect(modo.texto).toContain("Como prefere escolher os tamanhos?");
    expect(modo.texto).toContain("deixar de fora");
    expect(titulos(modo)).toEqual(["Um tamanho para tudo", "Escolher por peça", "Ajuda com medidas"]);
  });

  it("um tamanho para tudo vai ao resumo e confirma sem pagamento, com link", async () => {
    const resumo = ultima(await ateORevisar());
    expect(resumo.texto).toContain("Confira a pré-reserva de Lucas");
    expect(resumo.texto).toContain("Camiseta manga curta (2 peças): 8");
    expect(resumo.texto).toContain("Bermuda: 8");
    expect(resumo.texto).toContain("Como receber: Retirar na loja");
    expect(resumo.texto).toContain("não tem pagamento agora e não obriga a compra");

    const fim = await enviar({ escolha: "reserva.confirma" });
    expect(simulado.gravar).toHaveBeenCalledWith(
      expect.objectContaining({
        aluno: "Lucas",
        escola: ESCOLA,
        kit: "masculino",
        tamanhos: { curta: "8", longa: "8", inferior: "8", calca: "8", blusa: "8" },
        entrega: "loja",
      }),
    );
    expect(fim[0].texto).toContain("Pré-reserva de Lucas confirmada");
    expect(fim[0].texto).toContain("garantido para o começo das aulas");
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
    expect(ids(curta)).toEqual([...TAMANHOS_DA_LISTA, "reserva.sem"]);
    expect(titulos(curta)).toContain("Não quero esta peça");
    expect(descricao("4")).toBe("Comprimento 45 cm, largura do corpo 35 cm");
    expect(descricao("10")).toBe("Comprimento 57 cm, largura do corpo 41 cm");
    expect(descricao("G")).toBe("Comprimento 77 cm, largura do corpo 57 cm");

    const longa = ultima(await enviar({ escolha: "tam.6" }));
    expect(longa.opcoes.find((opcao) => opcao.id === "tam.14")?.descricao).toBe(
      "Comprimento 65 cm, largura do corpo 45 cm",
    );

    const bermuda = ultima(await enviar({ escolha: "tam.8" }));
    expect(bermuda.opcoes.find((opcao) => opcao.id === "tam.4")?.descricao).toBe(
      "Cintura com elástico relaxado 22 cm, quadril 34 cm",
    );
    const calca = ultima(await enviar({ escolha: "tam.8" }));
    expect(calca.opcoes.find((opcao) => opcao.id === "tam.G")?.descricao).toBe(
      "Cintura com elástico relaxado 38 cm, quadril 56 cm",
    );
    const blusa = ultima(await enviar({ escolha: "tam.10" }));
    expect(blusa.opcoes.find((opcao) => opcao.id === "tam.P")?.descricao).toBe(
      "Comprimento da frente 70 cm, largura do corpo 50 cm",
    );
    const entrega = ultima(await enviar({ escolha: "tam.12" }));
    expect(entrega.texto).toContain("O kit completo tem entrega grátis em casa.");
    expect(entrega.texto).toContain("dá para mudar depois");
    expect(titulos(entrega)).toEqual(["Receber em casa", "Retirar na loja"]);

    const resumo = ultima(await enviar({ escolha: "reserva.entrega.casa" }));
    expect(resumo.texto).toContain("Como receber: Receber em casa, com entrega grátis");
    expect(resumo.texto).toContain("Camiseta manga curta (2 peças): 6");
    expect(resumo.texto).toContain("Blusa de frio: 12");
  });

  it("ajuda com medidas separa medida conferida de medida em conferência", async () => {
    await ateOModo();
    const pecas = ultima(await enviar({ escolha: "reserva.modo.ajuda" }));
    expect(ids(pecas)).toContain("reserva.ajuda.curta");

    const curta = (await enviar({ escolha: "reserva.ajuda.curta" })).find((m) => m.tipo === "texto")!;
    expect(curta.texto).toContain("Tamanho 6: comprimento 49 cm, largura do corpo 37 cm");
    expect(curta.texto).toContain("Tamanho G: comprimento 77 cm, largura do corpo 57 cm");
    expect(curta.texto).not.toContain("GG");
    expect(curta.texto).not.toContain("conferência");

    await enviar({ escolha: "reserva.ajuda_outra" });
    const calca = (await enviar({ escolha: "reserva.ajuda.calca" })).find((m) => m.tipo === "texto")!;
    expect(calca.texto).toContain("Tamanho 4: cintura com elástico relaxado 22 cm, quadril 34 cm");
    expect(calca.texto).toContain("Tamanho M: cintura com elástico relaxado 36 cm, quadril 52 cm");

    const saia = textoMedidas(pecasDoKit("feminino")[2]);
    expect(saia).toContain("ainda estão em conferência");
    expect(saia).not.toMatch(/\d+ cm/);

    const modo = ultima(await enviar({ escolha: "reserva.ajuda_fim" }));
    expect(modo.texto).toContain("Como prefere escolher os tamanhos?");
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
    expect(retomada.texto).toContain("Como prefere escolher os tamanhos?");
    await enviar({ escolha: "reserva.modo.unico" });
    await enviar({ escolha: "tam.4" });
    expect(passo()).toBe("reserva_entrega");
    const resumo = ultima(await enviar({ escolha: "reserva.entrega.loja" }));
    expect(resumo.texto).toContain(`Escola: ${ESCOLA}`);
  });

  it("deixa a calça de fora e avisa que a entrega em casa deixa de ser grátis", async () => {
    await ateOModo();
    await enviar({ escolha: "reserva.modo.peca" });
    await enviar({ escolha: "tam.8" });
    await enviar({ escolha: "tam.8" });
    await enviar({ escolha: "tam.8" });
    await enviar({ escolha: "reserva.sem" });
    const entrega = ultima(await enviar({ escolha: "tam.10" }));
    expect(entrega.texto).toContain("Sem alguma peça do kit, a entrega em casa custa R$");
    expect(entrega.texto).toContain("15,00");

    const resumo = ultima(await enviar({ escolha: "reserva.entrega.casa" }));
    expect(resumo.texto).toContain("Calça: sem esta peça");
    expect(resumo.texto).toContain("Receber em casa, com entrega de R$");

    await enviar({ escolha: "reserva.confirma" });
    expect(simulado.gravar).toHaveBeenCalledWith(
      expect.objectContaining({
        tamanhos: { curta: "8", longa: "8", inferior: "8", calca: null, blusa: "10" },
        entrega: "casa",
      }),
    );
  });

  it("não deixa reservar sem nenhuma peça", async () => {
    await ateOModo();
    await enviar({ escolha: "reserva.modo.peca" });
    for (let i = 0; i < 4; i += 1) await enviar({ texto: "não quero" });
    const fim = await enviar({ escolha: "reserva.sem" });
    expect(fim[0].texto).toBe("Escolha ao menos uma peça para reservar.");
    expect(passo()).toBe("reserva_modo");
  });

  it("corrige a forma de receber pelo resumo", async () => {
    await ateORevisar();
    const campos = ultima(await enviar({ escolha: "reserva.corrigir" }));
    expect(campos.opcoes).toHaveLength(10);
    expect(ids(campos)).toContain("reserva.cor.entrega");

    await enviar({ escolha: "reserva.cor.entrega" });
    const resumo = ultima(await enviar({ escolha: "reserva.entrega.casa" }));
    expect(passo()).toBe("reserva_confirma");
    expect(resumo.texto).toContain("Receber em casa, com entrega grátis");
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
