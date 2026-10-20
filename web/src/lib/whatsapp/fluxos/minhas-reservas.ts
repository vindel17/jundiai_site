/**
 * "Minhas reservas": a família vê o que reservou e ajusta tamanho ou entrega
 * até 31 de dezembro. O número da conversa identifica a família, sem login.
 */

import {
  atualizarReserva,
  listarReservasDoTelefone,
  type ReservaLinha,
} from "@/lib/reserva/consultas";
import { rotuloEntrega, type Entrega } from "@/lib/reserva/entrega";
import {
  kitCompleto,
  pecasDoKit,
  reservaAberta,
  resumoTamanhos,
  rotuloKit,
  temAlgumaPeca,
  type TamanhosKit,
} from "@/lib/reserva/kit";
import { enviarBotoes, enviarLista, enviarTexto } from "../enviar";
import { mostrarMenu } from "../menu";
import { dadoTexto, type ResultadoTurno, type Sessao } from "../sessao";
import type { EntradaUsuario } from "../tipos";
import { enviarPerguntaEntrega, enviarPerguntaPeca } from "./reserva-perguntas";
import { entregaEscolhida, semEstaPeca, tamanhoDaEntrada } from "./reserva-tamanhos";

const RES = "minhas.r.";
const CAMPO = "minhas.c.";
const MAIS = "minhas.mais";
const FIM = "minhas.fim";

type Dados = Record<string, unknown>;
type Passo = (sessao: Sessao, entrada: EntradaUsuario) => Promise<ResultadoTurno>;

function resumo(linha: ReservaLinha) {
  const entrega = linha.entrega
    ? rotuloEntrega(linha.entrega, kitCompleto(linha.tamanhos))
    : "ainda não informado";
  return [
    `*${linha.aluno}* · ${linha.escola}`,
    `Kit ${rotuloKit(linha.kit).toLowerCase()}`,
    resumoTamanhos(linha.kit, linha.tamanhos),
    `Como receber: ${entrega}`,
  ].join("\n");
}

/** Só a reserva ainda recebida pode mudar; depois disso a equipe já está separando. */
async function editaveis(waId: string) {
  const { linhas } = await listarReservasDoTelefone(waId);
  return linhas.filter((linha) => linha.status === "recebida");
}

async function reservaDaSessao(sessao: Sessao) {
  const id = dadoTexto(sessao.dados, "reserva");
  return (await editaveis(sessao.waId)).find((linha) => linha.id === id) ?? null;
}

export async function iniciarMinhasReservas(sessao: Sessao): Promise<ResultadoTurno> {
  let linhas: ReservaLinha[];
  try {
    linhas = (await listarReservasDoTelefone(sessao.waId)).linhas;
  } catch (erro) {
    console.error("[minhas-reservas] falha ao ler", erro);
    await enviarTexto(sessao.waId, "Não consegui abrir suas reservas agora. Tente de novo em instantes.");
    return mostrarMenu(sessao);
  }

  if (linhas.length === 0) {
    await enviarTexto(
      sessao.waId,
      "Ainda não encontrei pré-reserva neste número. Toque em *Reservar uniforme* no menu para fazer a sua.",
    );
    return mostrarMenu(sessao);
  }

  for (const linha of linhas) await enviarTexto(sessao.waId, resumo(linha));
  if (!reservaAberta()) {
    await enviarTexto(
      sessao.waId,
      "O prazo para ajustar terminou em 31 de dezembro. O aviso de janeiro chega nesta conversa.",
    );
    return mostrarMenu(sessao);
  }
  return perguntarQual(sessao, linhas.filter((linha) => linha.status === "recebida"));
}

async function perguntarQual(sessao: Sessao, linhas: ReservaLinha[]): Promise<ResultadoTurno> {
  if (linhas.length === 0) return mostrarMenu(sessao);
  if (linhas.length === 1) return perguntarCampo(sessao.waId, sessao.dados, linhas[0]);
  await enviarLista(
    sessao.waId,
    "Quer ajustar alguma? Escolha o(a) aluno(a).",
    "Escolher",
    [
      ...linhas.slice(0, 9).map((linha, i) => ({
        id: `${RES}${i}`,
        titulo: linha.aluno,
        descricao: `${rotuloKit(linha.kit)} · ${linha.escola}`,
      })),
      { id: FIM, titulo: "Voltar ao menu" },
    ],
  );
  return {
    passo: "minhas_escolher",
    dados: { ...sessao.dados, reservas: linhas.slice(0, 9).map((linha) => linha.id) },
  };
}

async function perguntarCampo(waId: string, dados: Dados, linha: ReservaLinha) {
  await enviarLista(
    waId,
    `O que quer ajustar na reserva de ${linha.aluno}? Dá para mudar até 31 de dezembro.`,
    "Escolher item",
    [
      ...pecasDoKit(linha.kit).map((peca) => {
        const atual = linha.tamanhos[peca.chave];
        return {
          id: `${CAMPO}${peca.chave}`,
          titulo: peca.nome,
          descricao: atual ? `Tamanho atual: ${atual}` : "Fora da reserva",
        };
      }),
      {
        id: `${CAMPO}entrega`,
        titulo: "Como receber",
        descricao: linha.entrega
          ? rotuloEntrega(linha.entrega, kitCompleto(linha.tamanhos))
          : "Ainda não informado",
      },
      { id: FIM, titulo: "Nada, voltar ao menu" },
    ],
  );
  return { passo: "minhas_campo", dados: { ...dados, reserva: linha.id } };
}

async function salvar(
  sessao: Sessao,
  linha: ReservaLinha,
  tamanhos: TamanhosKit,
  entrega: Entrega | null,
): Promise<ResultadoTurno> {
  const resultado = await atualizarReserva(linha.id, tamanhos, entrega).catch(() => ({
    erro: "falha",
  }));
  if ("erro" in resultado && resultado.erro) {
    await enviarTexto(sessao.waId, "Não consegui salvar agora. Tente de novo.");
    return perguntarCampo(sessao.waId, sessao.dados, linha);
  }

  const nova = { ...linha, tamanhos, entrega };
  await enviarBotoes(sessao.waId, `Pronto, reserva atualizada:\n\n${resumo(nova)}`, [
    { id: MAIS, titulo: "Ajustar mais" },
    { id: FIM, titulo: "Concluir" },
  ]);
  return { passo: "minhas_fim", dados: sessao.dados };
}

const passoEscolher: Passo = async (sessao, entrada) => {
  if (entrada.escolha === FIM) return mostrarMenu(sessao);
  const ids = Array.isArray(sessao.dados.reservas) ? (sessao.dados.reservas as string[]) : [];
  const indice = entrada.escolha?.startsWith(RES) ? Number(entrada.escolha.slice(RES.length)) : -1;
  const linhas = await editaveis(sessao.waId);
  const linha = linhas.find((item) => item.id === ids[indice]);
  if (linha) return perguntarCampo(sessao.waId, sessao.dados, linha);
  return perguntarQual(sessao, linhas);
};

const passoCampo: Passo = async (sessao, entrada) => {
  if (entrada.escolha === FIM) return mostrarMenu(sessao);
  const linha = await reservaDaSessao(sessao);
  if (!linha) return iniciarMinhasReservas(sessao);

  const campo = entrada.escolha?.startsWith(CAMPO) ? entrada.escolha.slice(CAMPO.length) : "";
  if (campo === "entrega") {
    await enviarPerguntaEntrega(sessao.waId, kitCompleto(linha.tamanhos));
    return { passo: "minhas_entrega", dados: sessao.dados };
  }
  const peca = pecasDoKit(linha.kit).find((item) => item.chave === campo);
  if (!peca) return perguntarCampo(sessao.waId, sessao.dados, linha);
  await enviarPerguntaPeca(sessao.waId, peca, linha.aluno);
  return { passo: "minhas_tamanho", dados: { ...sessao.dados, peca: peca.chave } };
};

const passoTamanho: Passo = async (sessao, entrada) => {
  const linha = await reservaDaSessao(sessao);
  if (!linha) return iniciarMinhasReservas(sessao);
  const peca = pecasDoKit(linha.kit).find((item) => item.chave === dadoTexto(sessao.dados, "peca"));
  if (!peca) return perguntarCampo(sessao.waId, sessao.dados, linha);

  const sem = semEstaPeca(entrada);
  const tamanho = sem ? null : tamanhoDaEntrada(entrada);
  if (!sem && !tamanho) {
    await enviarPerguntaPeca(sessao.waId, peca, linha.aluno);
    return { passo: "minhas_tamanho", dados: sessao.dados };
  }

  const tamanhos = { ...linha.tamanhos, [peca.chave]: tamanho };
  if (!temAlgumaPeca(tamanhos)) {
    await enviarTexto(
      sessao.waId,
      "A reserva precisa de ao menos uma peça. Para desistir dela, é só escrever aqui que a equipe ajuda.",
    );
    return perguntarCampo(sessao.waId, sessao.dados, linha);
  }
  return salvar(sessao, linha, tamanhos, linha.entrega);
};

const passoEntrega: Passo = async (sessao, entrada) => {
  const linha = await reservaDaSessao(sessao);
  if (!linha) return iniciarMinhasReservas(sessao);
  const entrega = entregaEscolhida(entrada);
  if (!entrega) {
    await enviarPerguntaEntrega(sessao.waId, kitCompleto(linha.tamanhos));
    return { passo: "minhas_entrega", dados: sessao.dados };
  }
  return salvar(sessao, linha, linha.tamanhos, entrega);
};

const passoFim: Passo = async (sessao, entrada) => {
  if (entrada.escolha !== MAIS) return mostrarMenu(sessao);
  const linha = await reservaDaSessao(sessao);
  if (!linha) return iniciarMinhasReservas(sessao);
  return perguntarCampo(sessao.waId, sessao.dados, linha);
};

const PASSOS: Record<string, Passo> = {
  minhas_escolher: passoEscolher,
  minhas_campo: passoCampo,
  minhas_tamanho: passoTamanho,
  minhas_entrega: passoEntrega,
  minhas_fim: passoFim,
};

export async function continuarMinhasReservas(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  const passo = PASSOS[sessao.passo];
  if (!passo || !reservaAberta()) return iniciarMinhasReservas(sessao);
  return passo(sessao, entrada);
}
