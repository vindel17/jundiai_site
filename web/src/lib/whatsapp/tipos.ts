/**
 * Normaliza o webhook da Meta.
 *
 * O payload é aninhado e cresce com o tempo (mensagem, status de entrega,
 * reação…). Os fluxos do agente não deveriam conhecer esse formato, então tudo
 * o que entra vira uma `EntradaUsuario` simples.
 */

export type TipoEntrada = "texto" | "botao" | "imagem" | "outro";

export type EntradaUsuario = {
  mensagemId: string;
  waId: string;
  nome: string | null;
  tipo: TipoEntrada;
  /** Corpo do texto ou rótulo do botão escolhido. */
  texto: string;
  /** Identificador do botão/lista, quando a resposta foi interativa. */
  escolha: string | null;
  /** Id da mídia na Meta — o download exige token e vem depois. */
  midiaId: string | null;
};

type Registro = Record<string, unknown>;

function objeto(valor: unknown): Registro | null {
  return typeof valor === "object" && valor !== null ? (valor as Registro) : null;
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : [];
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function nomeDoContato(contatos: unknown[], waId: string): string | null {
  for (const bruto of contatos) {
    const contato = objeto(bruto);
    if (!contato || texto(contato.wa_id) !== waId) continue;
    const nome = texto(objeto(contato.profile)?.name);
    if (nome) return nome;
  }
  return null;
}

function normalizar(bruta: Registro, contatos: unknown[]): EntradaUsuario | null {
  const mensagemId = texto(bruta.id);
  const waId = texto(bruta.from);
  if (!mensagemId || !waId) return null;

  const base = {
    mensagemId,
    waId,
    nome: nomeDoContato(contatos, waId),
    escolha: null as string | null,
    midiaId: null as string | null,
  };

  const tipo = texto(bruta.type);

  if (tipo === "text") {
    return { ...base, tipo: "texto", texto: texto(objeto(bruta.text)?.body) };
  }

  if (tipo === "interactive") {
    const interativo = objeto(bruta.interactive);
    const resposta =
      objeto(interativo?.button_reply) ?? objeto(interativo?.list_reply);
    return {
      ...base,
      tipo: "botao",
      texto: texto(resposta?.title),
      escolha: texto(resposta?.id) || null,
    };
  }

  // Botão de template (quick reply) chega em outro formato.
  if (tipo === "button") {
    const botao = objeto(bruta.button);
    return {
      ...base,
      tipo: "botao",
      texto: texto(botao?.text),
      escolha: texto(botao?.payload) || null,
    };
  }

  if (tipo === "image") {
    const imagem = objeto(bruta.image);
    return {
      ...base,
      tipo: "imagem",
      texto: texto(imagem?.caption),
      midiaId: texto(imagem?.id) || null,
    };
  }

  return { ...base, tipo: "outro", texto: "" };
}

export function extrairEntradas(payload: unknown): EntradaUsuario[] {
  const raiz = objeto(payload);
  if (!raiz) return [];

  const entradas: EntradaUsuario[] = [];

  for (const entryBruta of lista(raiz.entry)) {
    for (const changeBruta of lista(objeto(entryBruta)?.changes)) {
      const valor = objeto(objeto(changeBruta)?.value);
      if (!valor) continue;

      const contatos = lista(valor.contacts);
      for (const mensagemBruta of lista(valor.messages)) {
        const mensagem = objeto(mensagemBruta);
        if (!mensagem) continue;
        const normalizada = normalizar(mensagem, contatos);
        if (normalizada) entradas.push(normalizada);
      }
    }
  }

  return entradas;
}
