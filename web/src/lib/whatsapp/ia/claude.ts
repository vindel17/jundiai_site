import { ESQUEMA_FERRAMENTAS } from "./ferramentas";

const MODELO = "claude-haiku-5-5";
const VERSAO = "2026-10-21";

type Mensagem = {
  role: "user" | "assistant";
  content: string | unknown[];
};

type Bloco = {
  type?: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
};

export class ErroIa extends Error {}

export async function completar(opcoes: {
  sistema: string;
  mensagens: Mensagem[];
  executar: (nome: string, entrada: Record<string, unknown>) => Promise<string>;
}) {
  const chave = process.env.ANTHROPIC_API_KEY?.trim();
  if (!chave) throw new ErroIa("ANTHROPIC_API_KEY ausente");

  const mensagens = opcoes.mensagens.map((mensagem) => ({ ...mensagem }));
  let consultou = false;
  const signal = AbortSignal.timeout(12_000);

  for (let rodada = 0; rodada < 3; rodada += 1) {
    const blocos = await chamar(chave, opcoes.sistema, mensagens, signal);
    const usos = blocos.filter((bloco) => bloco.type === "tool_use" && bloco.id && bloco.name);
    const texto = blocos
      .filter((bloco) => bloco.type === "text" && bloco.text)
      .map((bloco) => bloco.text)
      .join("\n")
      .trim();

    if (usos.length === 0) {
      if (!texto) throw new ErroIa("resposta vazia");
      return { texto, consultou };
    }

    mensagens.push({ role: "assistant", content: blocos });
    const resultados = [];
    for (const uso of usos) {
      if (uso.name === "consultar_disponibilidade") consultou = true;
      const entrada =
        typeof uso.input === "object" && uso.input !== null
          ? (uso.input as Record<string, unknown>)
          : {};
      let saida: string;
      try {
        saida = await opcoes.executar(uso.name ?? "", entrada);
      } catch (erro) {
        saida = JSON.stringify({
          ok: false,
          texto: "A consulta falhou. Não afirme disponibilidade.",
        });
        console.error("Ferramenta do atendimento falhou", { nome: uso.name, erro });
      }
      resultados.push({ type: "tool_result", tool_use_id: uso.id, content: saida });
    }
    mensagens.push({ role: "user", content: resultados });
  }

  throw new ErroIa("muitas ferramentas");
}

async function chamar(
  chave: string,
  sistema: string,
  mensagens: Mensagem[],
  signal: AbortSignal,
) {
  const resposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "x-api-key": chave,
      "anthropic-version": VERSAO,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 500,
      output_config: { effort: "low" },
      system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
      tools: ESQUEMA_FERRAMENTAS,
      messages: mensagens,
    }),
  });
  if (!resposta.ok) throw new ErroIa(`Claude ${resposta.status}`);
  const corpo = (await resposta.json()) as { content?: Bloco[] };
  return Array.isArray(corpo.content) ? corpo.content : [];
}
