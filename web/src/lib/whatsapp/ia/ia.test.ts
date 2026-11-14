import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarDisponibilidade } from "./ferramentas";
import { afirmaEstoque, instrucoes, TEXTO_SEM_CONFIRMACAO, textoParaFamilia } from "./regras";

describe("regras do atendimento", () => {
  it("não afirma estoque e inclui a base da loja", () => {
    const texto = instrucoes("Retirada na loja, de segunda a sexta.");
    expect(texto).toContain("Retirada na loja, de segunda a sexta.");
    expect(texto).toContain("Não invente a data");
    expect(texto).toContain("Não diga que a loja é a Prefeitura");
    expect(consultarDisponibilidade({ peca: "camiseta", tamanho: "8" }).situacao).toBe("incompleta");
    const consulta = consultarDisponibilidade({ peca: "camiseta-manga-curta", tamanho: "8" });
    expect(consulta.situacao).toBe("confirmar");
    expect(JSON.stringify(consulta)).not.toMatch(/em estoque|temos sim|esgotad/i);
  });

  it("troca uma resposta que afirma estoque pela frase segura", () => {
    expect(afirmaEstoque("Temos sim a camiseta tamanho 8.")).toBe(true);
    expect(afirmaEstoque("A data de liberação ainda não foi confirmada.")).toBe(false);
    expect(textoParaFamilia("Temos sim a camiseta tamanho 8.")).toBe(TEXTO_SEM_CONFIRMACAO);
    expect(textoParaFamilia("A pré-reserva é gratuita.")).toBe("A pré-reserva é gratuita.");
  });
});

describe("Claude Haiku", () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("consulta a ferramenta e devolve o texto final", async () => {
    process.env.ANTHROPIC_API_KEY = "teste";
    const chamadas: unknown[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      chamadas.push(JSON.parse(String(init && "body" in init ? init.body : "{}")));
      const rodada = chamadas.length;
      const content = rodada === 1
        ? [{ type: "tool_use", id: "tool_1", name: "consultar_disponibilidade", input: { peca: "camiseta-manga-curta", tamanho: "8" } }]
        : [{ type: "text", text: "Ainda não confirmo essa peça." }];
      return new Response(JSON.stringify({ content }), { status: 200 });
    }) as typeof fetch;

    const { completar } = await import("./claude");
    const resultado = await completar({
      sistema: "regras",
      mensagens: [{ role: "user", content: "Tem camiseta manga curta tamanho 8?" }],
      executar: async (nome, entrada) => JSON.stringify({ nome, entrada }),
    });

    expect(resultado.consultou).toBe(true);
    expect(resultado.texto).toBe("Ainda não confirmo essa peça.");
    const primeira = chamadas[0] as { model: string; output_config: { effort: string } };
    expect(primeira.model).toBe("claude-haiku-5-5");
    expect(primeira.output_config.effort).toBe("low");
    const segunda = chamadas[1] as { messages: { content: { type?: string }[] }[] };
    const retorno = segunda.messages.at(-1)?.content;
    expect(Array.isArray(retorno) && retorno[0]?.type).toBe("tool_result");
  });
});
