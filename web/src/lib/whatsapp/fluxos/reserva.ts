/**
 * Pré-reserva gratuita do kit 2027 pelo WhatsApp.
 * Escola e nome do(a) aluno(a), opção do kit, tamanhos, revisão e confirmação.
 * Não mostra preço. A origem chega na primeira mensagem (panfleto, rede ou anúncio).
 */

import { buscarEscolas } from "@/lib/reserva/escolas";
import { reservaAberta, type KitGenero } from "@/lib/reserva/kit";
import type { Origem } from "@/lib/reserva/origem";
import { enviarBotoes, enviarLista, enviarTexto } from "../enviar";
import { querMenu } from "../intencao";
import { mostrarMenu } from "../menu";
import { dadoTexto, type ResultadoTurno, type Sessao } from "../sessao";
import type { EntradaUsuario } from "../tipos";
import {
  ESC,
  KIT_F,
  KIT_M,
  RECOMECAR,
  RETOMAR,
  comRascunho,
  escolasDosDados,
  guardarOrigem,
  lerRascunho,
  origemDosDados,
  semChave,
} from "./reserva-estado";
import {
  botoesKit,
  mostrarKits,
  perguntarEscola,
  perguntarModo,
  perguntarNome,
  repetirPergunta,
  seguir,
} from "./reserva-perguntas";
import { passoConfirma, passoCorrigir, passoOutraEscola, passoOutro } from "./reserva-revisao";
import {
  passoAjuda,
  passoEntrega,
  passoModo,
  passoTamanho,
  passoTamanhoUnico,
} from "./reserva-tamanhos";

type Passo = (sessao: Sessao, entrada: EntradaUsuario) => Promise<ResultadoTurno>;

const PASSOS: Record<string, Passo> = {
  reserva_retomar: passoRetomar,
  reserva_escola: passoEscola,
  reserva_nome: passoNome,
  reserva_kit: passoKit,
  reserva_modo: passoModo,
  reserva_tamanho_unico: passoTamanhoUnico,
  reserva_tamanho: passoTamanho,
  reserva_ajuda: passoAjuda,
  reserva_entrega: passoEntrega,
  reserva_confirma: passoConfirma,
  reserva_corrigir: passoCorrigir,
  reserva_outro: passoOutro,
  reserva_outra_escola: passoOutraEscola,
};

export async function iniciarReserva(
  sessao: Sessao,
  origem: Origem,
): Promise<ResultadoTurno> {
  if (!reservaAberta()) {
    await enviarTexto(
      sessao.waId,
      "As pré-reservas foram até 31 de dezembro. Se você já reservou, o aviso de janeiro chega nesta conversa.",
    );
    return mostrarMenu(sessao);
  }

  const rascunho = lerRascunho(sessao.dados);
  if (rascunho) {
    const nome = dadoTexto(rascunho.dados, "aluno");
    await enviarBotoes(
      sessao.waId,
      `Você começou uma pré-reserva${nome ? ` para ${nome}` : ""} e parou no meio. Quer continuar de onde parou?`,
      [
        { id: RETOMAR, titulo: "Continuar" },
        { id: RECOMECAR, titulo: "Começar de novo" },
      ],
    );
    return { passo: "reserva_retomar", dados: comRascunho(guardarOrigem(origem), rascunho) };
  }

  await enviarTexto(
    sessao.waId,
    [
      "Com a pré-reserva, você garante que vai encontrar o uniforme no tamanho certo antes de começar as aulas. 🎒",
      "",
      "É gratuita: não tem pagamento agora e não obriga a compra.",
      "",
      "O kit tem 6 peças: 2 camisetas manga curta no mesmo tamanho, 1 camiseta manga longa, 1 bermuda ou short-saia, 1 calça e 1 blusa de frio. Se não precisar de alguma, é só deixar de fora.",
      "",
      "Quando seu kit estiver pronto, avisamos nesta conversa e você decide se deseja finalizar a compra.",
    ].join("\n"),
  );
  return perguntarEscola(sessao.waId, guardarOrigem(origem));
}

export async function continuarReserva(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  if (querMenu(entrada.escolha, entrada.texto)) return mostrarMenu(sessao);
  if (!reservaAberta()) return iniciarReserva(sessao, origemDosDados(sessao.dados));

  const passo = PASSOS[sessao.passo];
  if (!passo) return iniciarReserva(sessao, origemDosDados(sessao.dados));
  return passo(sessao, entrada);
}

async function passoRetomar(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const rascunho = lerRascunho(sessao.dados);
  const origem = origemDosDados(sessao.dados);
  if (entrada.escolha === RETOMAR && rascunho) {
    return repetirPergunta(sessao.waId, rascunho.passo, rascunho.dados);
  }
  if (entrada.escolha === RECOMECAR || !rascunho) {
    return iniciarReserva({ ...sessao, dados: guardarOrigem(origem) }, origem);
  }
  return iniciarReserva(sessao, origem);
}

async function passoEscola(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const indice = entrada.escolha?.startsWith(ESC)
    ? Number(entrada.escolha.slice(ESC.length))
    : Number.NaN;
  const escolhida = escolasDosDados(sessao.dados)[indice];
  if (escolhida) {
    const dados = { ...semChave(sessao.dados, "escolas"), escola: escolhida };
    return seguir(sessao.waId, dados, () => perguntarNome(sessao.waId, dados));
  }

  const busca = buscarEscolas(entrada.texto);
  if (busca.escolas.length === 0) {
    await enviarTexto(
      sessao.waId,
      "Não encontrei essa escola. Digite outro trecho do nome, como aparece na lista da rede municipal.",
    );
    return { passo: "reserva_escola", dados: sessao.dados };
  }
  if (busca.restantes > 0) {
    await enviarTexto(
      sessao.waId,
      "Achei várias. Digite mais um pedaço do nome para eu reduzir a lista.",
    );
    return { passo: "reserva_escola", dados: sessao.dados };
  }

  await enviarLista(
    sessao.waId,
    "Qual destas é a escola?",
    "Escolher escola",
    busca.escolas.map((nome, i) => ({
      id: `${ESC}${i}`,
      titulo: nome.slice(0, 24),
      descricao: nome.slice(0, 72),
    })),
  );
  return { passo: "reserva_escola", dados: { ...sessao.dados, escolas: busca.escolas } };
}

/** "lucas." vira "Lucas"; mantém nomes compostos como "Ana Clara". */
export function nomeDoAluno(texto: string) {
  return texto
    .replace(/[^\p{L}\s'-]/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40)
    .split(" ")
    .map((parte) => parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1))
    .join(" ");
}

async function passoNome(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const nome = entrada.escolha ? "" : nomeDoAluno(entrada.texto);
  if (nome.length < 2) {
    await enviarTexto(sessao.waId, "Me diga o primeiro nome do(a) aluno(a).");
    return { passo: "reserva_nome", dados: sessao.dados };
  }
  const dados = { ...sessao.dados, aluno: nome };
  return seguir(sessao.waId, dados, () => mostrarKits(sessao.waId, dados));
}

function kitEscolhido(entrada: EntradaUsuario): KitGenero | null {
  const texto = entrada.texto.toLowerCase();
  if (entrada.escolha === KIT_F || /saia|femin/.test(texto)) return "feminino";
  if (entrada.escolha === KIT_M || /bermuda|mascul/.test(texto)) return "masculino";
  return null;
}

async function passoKit(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const kit = kitEscolhido(entrada);
  if (!kit) {
    await botoesKit(sessao.waId, "Toque em uma das opções do kit:");
    return { passo: "reserva_kit", dados: sessao.dados };
  }
  const dados = { ...sessao.dados, kit };
  return seguir(sessao.waId, dados, () => perguntarModo(sessao.waId, dados));
}
