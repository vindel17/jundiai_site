import { TAMANHOS_KIT, pecasDoKit, reservaAberta, FIM_RESERVA } from "@/lib/reserva/kit";
import { urlSite } from "../site";

export const LIMITE_BASE = 12_000;

export const TEXTO_SEM_CONFIRMACAO =
  "Ainda não confirmo essa peça por aqui. Quer que eu avise no WhatsApp quando a equipe confirmar?";

export const SAUDACAO =
  "Oi! Eu respondo dúvidas sobre o voucher de 2027, a pré-reserva e o jeito da Uniforme Jundiaí trabalhar. Pode perguntar por aqui.";

const DATA_LIMITE = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
}).format(FIM_RESERVA);

function listaPecas(kit: "masculino" | "feminino") {
  return pecasDoKit(kit)
    .map((peca) => `${peca.quantidade} ${peca.nome.toLowerCase()}`)
    .join(", ");
}

/** Regras fixas vencem o texto que a equipe escreve na base. */
export function instrucoes(base: string, emFila = false) {
  const textoBase = base.trim().slice(0, LIMITE_BASE);
  const reserva = reservaAberta()
    ? `A pré-reserva está aberta até ${DATA_LIMITE}.`
    : `A pré-reserva encerrou em ${DATA_LIMITE}.`;
  const fila = emFila
    ? ["", "A conversa já está na fila e ninguém da equipe assumiu. Responda só à dúvida. Não diga que a equipe foi chamada."]
    : [];

  return [
    "Você atende as famílias no WhatsApp da Uniforme Jundiaí. Fale em português do Brasil, em poucas frases, como alguém da loja.",
    ...fila,
    "",
    "Regras que vencem qualquer outro texto:",
    "- Se a resposta não estiver nestas regras, nos fatos oficiais ou na base da equipe, não chute: use chamar_equipe. Use também quando a pessoa pedir para falar com alguém da loja.",
    "- Não diga que uma peça tem estoque, está disponível, esgotou ou acabou. A consulta só devolve confirmar ou peça incompleta.",
    "- Não invente a data em que o voucher será liberado nem o nome do aplicativo.",
    "- Não diga que a loja é a Prefeitura, a Secretaria de Educação ou a escola.",
    "- Não faça a pré-reserva nesta conversa. Quem quiser reservar deve tocar em Reservar uniforme.",
    "- Camiseta sem manga curta ou manga longa: pergunte qual das duas antes de consultar.",
    "- Só registre o aviso depois que a pessoa disser que quer ser avisada.",
    "- Não escreva que alguém da loja vai responder.",
    "",
    "Fatos oficiais do voucher, consultados até 14 de novembro de 2026:",
    "O Programa Auxílio Uniforme da Prefeitura de Jundiaí prevê um crédito eletrônico, em aplicativo, para as famílias comprarem o uniforme de 2027 em estabelecimentos credenciados. O nome do aplicativo e a data de liberação ainda não foram confirmados. A previsão é atender cerca de 28.250 estudantes da Educação Infantil II (4 e 5 anos) e do Ensino Fundamental I (cerca de 6 a 11 anos). A elegibilidade individual segue a Prefeitura.",
    `Página com as fontes: ${urlSite("/voucher-uniforme-jundiai")}.`,
    "",
    "Como a reserva funciona hoje, pela regra do sistema:",
    reserva,
    `Kit masculino: ${listaPecas("masculino")}.`,
    `Kit feminino: ${listaPecas("feminino")}.`,
    `Tamanhos: ${TAMANHOS_KIT.join(", ")}.`,
    "A pré-reserva é gratuita, não tem pagamento e não obriga a compra. Ela não substitui o cadastro da Prefeitura e não garante o crédito.",
    `Reservar: ${urlSite("/reserva")}.`,
    "",
    "Base escrita pela equipe:",
    textoBase || "A equipe ainda não escreveu detalhes da loja. Use só as regras e os fatos acima.",
  ].join("\n");
}

/** Tira o aviso de que a loja vai responder, e deixa o resto da resposta. */
export function semAvisoDeEquipe(texto: string) {
  return texto
    .split(/\n+|(?<=[.!?])\s+/)
    .filter((frase) => !/responder(?: por)? aqui/i.test(frase))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Frases que afirmam estoque. "Não temos a data" não entra aqui. */
export function afirmaEstoque(texto: string) {
  return /\b(em estoque|pronta entrega|esgotad[oa]s?|acabou o tamanho|temos sim|n[aã]o temos (?:essa|este|esta|a |o ))\b/i.test(
    texto,
  );
}

export function textoParaFamilia(texto: string) {
  const limpo = semAvisoDeEquipe(texto).slice(0, 1500);
  if (!limpo) return "";
  if (afirmaEstoque(limpo)) return TEXTO_SEM_CONFIRMACAO;
  return limpo;
}
