/**
 * Cada pergunta da reserva, pronta para ser enviada de novo.
 * Quem volta à conversa recebe a mesma pergunta do passo em que parou.
 */

import { fotoDaPeca } from "@/lib/reserva/fotos";
import { TAMANHOS_KIT } from "@/lib/reserva/kit";
import { descricaoKit, pecasDoKit, resumoTamanhos, rotuloKit, type PecaKit } from "@/lib/reserva/kit";
import { rotuloMedida } from "@/lib/reserva/medidas";
import { enviarBotoes, enviarImagem, enviarLista, enviarTexto } from "../enviar";
import { dadoTexto, type ResultadoTurno } from "../sessao";
import { urlSite } from "../site";
import {
  AJUDA,
  CONFIRMA,
  COR,
  CORRIGIR,
  KIT_F,
  KIT_M,
  MESMA_ESCOLA,
  MODO_AJUDA,
  MODO_PECA,
  MODO_UNICO,
  OUTRA_ESCOLA,
  OUTRO_NAO,
  OUTRO_SIM,
  corrigindo,
  kitDosDados,
  pecaAtual,
  semCorrecao,
  tamanhosDosDados,
} from "./reserva-estado";

type Dados = Record<string, unknown>;

function aluno(dados: Dados) {
  return dadoTexto(dados, "aluno") || "o(a) aluno(a)";
}

export async function perguntarEscola(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarTexto(
    waId,
    "Digite parte do nome da escola do(a) aluno(a). Eu mostro a lista para você escolher.",
  );
  return { passo: "reserva_escola", dados };
}

export async function perguntarNome(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarTexto(waId, "Qual é o primeiro nome do(a) aluno(a)?");
  return { passo: "reserva_nome", dados };
}

export async function botoesKit(waId: string, texto: string) {
  await enviarBotoes(waId, texto, [
    { id: KIT_M, titulo: rotuloKit("masculino") },
    { id: KIT_F, titulo: rotuloKit("feminino") },
  ]);
}

async function enviarPeca(waId: string, peca: PecaKit, legenda: string) {
  const foto = fotoDaPeca(peca);
  if (foto) await enviarImagem(waId, urlSite(foto), legenda);
  else await enviarTexto(waId, legenda);
}

export async function mostrarKits(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarTexto(waId, "Veja as duas opções de kit, cada uma com 6 peças. 😊");
  const kit = pecasDoKit("masculino");
  const saia = pecasDoKit("feminino").find((peca) => peca.chave === "inferior");
  for (const peca of kit) {
    if (peca.chave === "inferior") {
      await enviarPeca(
        waId,
        peca,
        `Kit ${rotuloKit("masculino").toLowerCase()}\n${descricaoKit("masculino")}`,
      );
      if (saia) {
        await enviarPeca(
          waId,
          saia,
          `Kit ${rotuloKit("feminino").toLowerCase()}\n${descricaoKit("feminino")}`,
        );
      }
      continue;
    }
    const quantidade = peca.quantidade > 1 ? "2 peças, no mesmo tamanho." : "1 peça.";
    await enviarPeca(waId, peca, `${peca.nome}. ${quantidade}`);
  }
  await botoesKit(waId, `Qual opção você deseja para ${aluno(dados)}?`);
  return { passo: "reserva_kit", dados };
}

export async function perguntarModo(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarBotoes(waId, "Como prefere escolher os tamanhos?", [
    { id: MODO_UNICO, titulo: "Um tamanho para tudo" },
    { id: MODO_PECA, titulo: "Escolher por peça" },
    { id: MODO_AJUDA, titulo: "Ajuda com medidas" },
  ]);
  return { passo: "reserva_modo", dados };
}

function itensTamanho(peca?: PecaKit) {
  return TAMANHOS_KIT.map((tamanho) => ({
    id: `tam.${tamanho}`,
    titulo: `Tamanho ${tamanho}`,
    descricao: peca ? rotuloMedida(peca.catalogoId, tamanho) : undefined,
  }));
}

export async function perguntarTamanhoUnico(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarLista(
    waId,
    `Qual tamanho para as 6 peças de ${aluno(dados)}?`,
    "Escolher tamanho",
    itensTamanho(),
  );
  return { passo: "reserva_tamanho_unico", dados };
}

export async function perguntarPeca(waId: string, dados: Dados): Promise<ResultadoTurno> {
  const peca = pecaAtual(dados);
  const quantidade =
    peca.quantidade > 1 ? `${peca.quantidade} peças, no mesmo tamanho` : "1 peça";
  const titulo = `${peca.nome} (${quantidade})`;
  const foto = fotoDaPeca(peca);
  if (foto) await enviarImagem(waId, urlSite(foto), titulo);
  await enviarLista(
    waId,
    `${foto ? "" : `${titulo}\n`}Qual tamanho para ${aluno(dados)}?`,
    "Escolher tamanho",
    itensTamanho(peca),
  );
  return { passo: "reserva_tamanho", dados: { ...dados, peca: peca.chave } };
}

export async function perguntarAjuda(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarLista(
    waId,
    "De qual peça você quer ver as medidas?",
    "Escolher peça",
    pecasDoKit(kitDosDados(dados)).map((peca) => ({
      id: `${AJUDA}${peca.chave}`,
      titulo: peca.nome,
    })),
  );
  return { passo: "reserva_ajuda", dados };
}

export async function revisar(waId: string, dados: Dados): Promise<ResultadoTurno> {
  const kit = kitDosDados(dados);
  const tamanhos = tamanhosDosDados(dados);
  if (!tamanhos) return perguntarModo(waId, dados);
  await enviarBotoes(
    waId,
    [
      `Confira a pré-reserva de ${aluno(dados)}:`,
      "",
      `Escola: ${dadoTexto(dados, "escola")}`,
      `Kit ${rotuloKit(kit).toLowerCase()}`,
      resumoTamanhos(kit, tamanhos),
      "",
      "A pré-reserva é gratuita: não tem pagamento agora e não obriga a compra. Os tamanhos podem mudar até 31 de dezembro.",
    ].join("\n"),
    [
      { id: CONFIRMA, titulo: "Confirmar" },
      { id: CORRIGIR, titulo: "Corrigir" },
    ],
  );
  return { passo: "reserva_confirma", dados };
}

/** Depois de responder um campo em correção, volta direto ao resumo. */
export function seguir(waId: string, dados: Dados, proximo: () => Promise<ResultadoTurno>) {
  return corrigindo(dados) ? revisar(waId, semCorrecao(dados)) : proximo();
}

export async function perguntarCorrecao(waId: string, dados: Dados): Promise<ResultadoTurno> {
  const tamanhos = tamanhosDosDados(dados);
  const pecas = pecasDoKit(kitDosDados(dados)).map((peca) => ({
    id: `${COR}${peca.chave}`,
    titulo: peca.nome,
    descricao: tamanhos ? `Tamanho atual: ${tamanhos[peca.chave]}` : undefined,
  }));
  await enviarLista(waId, "O que você quer corrigir?", "Escolher item", [
    { id: `${COR}escola`, titulo: "Escola", descricao: dadoTexto(dados, "escola") },
    { id: `${COR}aluno`, titulo: "Nome do(a) aluno(a)", descricao: dadoTexto(dados, "aluno") },
    { id: `${COR}kit`, titulo: "Opção do kit", descricao: rotuloKit(kitDosDados(dados)) },
    { id: `${COR}tamanhos`, titulo: "Todos os tamanhos" },
    ...pecas,
  ]);
  return { passo: "reserva_corrigir", dados };
}

export async function perguntarOutro(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarBotoes(waId, "Quer adicionar outro(a) aluno(a)?", [
    { id: OUTRO_SIM, titulo: "Adicionar aluno(a)" },
    { id: OUTRO_NAO, titulo: "Concluir" },
  ]);
  return { passo: "reserva_outro", dados };
}

export async function perguntarOutraEscola(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarBotoes(waId, `O(a) próximo(a) aluno(a) estuda em ${dadoTexto(dados, "escola")}?`, [
    { id: MESMA_ESCOLA, titulo: "Mesma escola" },
    { id: OUTRA_ESCOLA, titulo: "Outra escola" },
  ]);
  return { passo: "reserva_outra_escola", dados };
}

const PERGUNTAS: Record<string, (waId: string, dados: Dados) => Promise<ResultadoTurno>> = {
  reserva_escola: perguntarEscola,
  reserva_nome: perguntarNome,
  reserva_kit: mostrarKits,
  reserva_modo: perguntarModo,
  reserva_tamanho_unico: perguntarTamanhoUnico,
  reserva_tamanho: perguntarPeca,
  reserva_ajuda: perguntarAjuda,
  reserva_confirma: revisar,
  reserva_corrigir: perguntarCorrecao,
  reserva_outro: perguntarOutro,
  reserva_outra_escola: perguntarOutraEscola,
};

export function repetirPergunta(waId: string, passo: string, dados: Dados) {
  return (PERGUNTAS[passo] ?? perguntarEscola)(waId, dados);
}
