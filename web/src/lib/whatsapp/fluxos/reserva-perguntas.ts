/**
 * Cada pergunta da reserva, pronta para ser enviada de novo.
 * Quem volta à conversa recebe a mesma pergunta do passo em que parou.
 */

import { freteKitIncompleto, rotuloEntrega } from "@/lib/reserva/entrega";
import { fotoDaPeca, fotoDoKit } from "@/lib/reserva/fotos";
import {
  TAMANHOS_KIT,
  descricaoKit,
  kitCompleto,
  pecasDoKit,
  resumoTamanhos,
  rotuloKit,
  temAlgumaPeca,
  type KitGenero,
  type PecaKit,
} from "@/lib/reserva/kit";
import { rotuloMedida } from "@/lib/reserva/medidas";
import { enviarBotoes, enviarImagem, enviarLista, enviarTexto } from "../enviar";
import { dadoTexto, type ResultadoTurno } from "../sessao";
import { urlSite } from "../site";
import {
  AJUDA,
  CONFIRMA,
  COR,
  CORRIGIR,
  ENTREGA_CASA,
  ENTREGA_LOJA,
  KIT_F,
  KIT_M,
  MESMA_ESCOLA,
  MODO_AJUDA,
  MODO_PECA,
  MODO_UNICO,
  OUTRA_ESCOLA,
  OUTRO_NAO,
  OUTRO_SIM,
  SEM,
  corrigindo,
  entregaDosDados,
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

async function enviarKit(waId: string, kit: KitGenero) {
  const legenda = `Kit ${rotuloKit(kit).toLowerCase()}\n${descricaoKit(kit)}`;
  const foto = fotoDoKit(kit);
  if (foto) await enviarImagem(waId, urlSite(foto), legenda);
  else await enviarTexto(waId, legenda);
}

export async function mostrarKits(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarTexto(waId, "Veja as duas opções de kit, cada uma com 6 peças. 😊");
  await enviarKit(waId, "masculino");
  await enviarKit(waId, "feminino");
  await botoesKit(waId, `Qual opção você deseja para ${aluno(dados)}?`);
  return { passo: "reserva_kit", dados };
}

export async function perguntarModo(waId: string, dados: Dados): Promise<ResultadoTurno> {
  await enviarBotoes(
    waId,
    [
      "Como prefere escolher os tamanhos?",
      "",
      "Em *Escolher por peça* você vê a foto de cada uma e pode deixar de fora a que não precisar.",
    ].join("\n"),
    [
      { id: MODO_UNICO, titulo: "Um tamanho para tudo" },
      { id: MODO_PECA, titulo: "Escolher por peça" },
      { id: MODO_AJUDA, titulo: "Ajuda com medidas" },
    ],
  );
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

/** Foto da peça e lista de tamanhos com "Não quero esta peça". Usada também em "Minhas reservas". */
export async function enviarPerguntaPeca(waId: string, peca: PecaKit, nomeAluno: string) {
  const quantidade =
    peca.quantidade > 1 ? `${peca.quantidade} peças, no mesmo tamanho` : "1 peça";
  const titulo = `${peca.nome} (${quantidade})`;
  const foto = fotoDaPeca(peca);
  if (foto) await enviarImagem(waId, urlSite(foto), titulo);
  await enviarLista(
    waId,
    `${foto ? "" : `${titulo}\n`}Qual tamanho para ${nomeAluno}?`,
    "Escolher tamanho",
    [
      ...itensTamanho(peca),
      { id: SEM, titulo: "Não quero esta peça", descricao: "Reservar o kit sem ela" },
    ],
  );
}

export async function perguntarPeca(waId: string, dados: Dados): Promise<ResultadoTurno> {
  const peca = pecaAtual(dados);
  await enviarPerguntaPeca(waId, peca, aluno(dados));
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

export async function perguntarEntrega(waId: string, dados: Dados): Promise<ResultadoTurno> {
  const tamanhos = tamanhosDosDados(dados);
  await enviarPerguntaEntrega(waId, tamanhos ? kitCompleto(tamanhos) : true);
  return { passo: "reserva_entrega", dados };
}

/** Botões de casa ou loja, com a regra do frete. Usada também em "Minhas reservas". */
export async function enviarPerguntaEntrega(waId: string, completo: boolean) {
  await enviarBotoes(
    waId,
    [
      "Como prefere receber?",
      "",
      completo
        ? "O kit completo tem entrega grátis em casa."
        : `Sem alguma peça do kit, a entrega em casa custa ${freteKitIncompleto()}. O kit completo tem entrega grátis.`,
      "",
      "É só uma preferência: dá para mudar depois.",
    ].join("\n"),
    [
      { id: ENTREGA_CASA, titulo: "Receber em casa" },
      { id: ENTREGA_LOJA, titulo: "Retirar na loja" },
    ],
  );
}

/** Resumo para confirmar. Antes dele, garante ao menos uma peça e a forma de receber. */
export async function revisar(waId: string, dados: Dados): Promise<ResultadoTurno> {
  const kit = kitDosDados(dados);
  const tamanhos = tamanhosDosDados(dados);
  if (!tamanhos) return perguntarModo(waId, dados);
  if (!temAlgumaPeca(tamanhos)) {
    await enviarTexto(waId, "Escolha ao menos uma peça para reservar.");
    return perguntarModo(waId, dados);
  }
  const entrega = entregaDosDados(dados);
  if (!entrega) return perguntarEntrega(waId, dados);

  await enviarBotoes(
    waId,
    [
      `Confira a pré-reserva de ${aluno(dados)}:`,
      "",
      `Escola: ${dadoTexto(dados, "escola")}`,
      `Kit ${rotuloKit(kit).toLowerCase()}`,
      resumoTamanhos(kit, tamanhos),
      "",
      `Como receber: ${rotuloEntrega(entrega, kitCompleto(tamanhos))}`,
      "",
      "A pré-reserva é gratuita: não tem pagamento agora e não obriga a compra. Os tamanhos podem mudar até 31 de dezembro, e a forma de receber, depois também.",
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
  const entrega = entregaDosDados(dados);
  const pecas = pecasDoKit(kitDosDados(dados)).map((peca) => {
    const atual = tamanhos?.[peca.chave];
    return {
      id: `${COR}${peca.chave}`,
      titulo: peca.nome,
      descricao: atual ? `Tamanho atual: ${atual}` : atual === null ? "Fora da reserva" : undefined,
    };
  });
  await enviarLista(waId, "O que você quer corrigir?", "Escolher item", [
    { id: `${COR}escola`, titulo: "Escola", descricao: dadoTexto(dados, "escola") },
    { id: `${COR}aluno`, titulo: "Nome do(a) aluno(a)", descricao: dadoTexto(dados, "aluno") },
    { id: `${COR}kit`, titulo: "Opção do kit", descricao: rotuloKit(kitDosDados(dados)) },
    { id: `${COR}tamanhos`, titulo: "Todos os tamanhos" },
    ...pecas,
    {
      id: `${COR}entrega`,
      titulo: "Como receber",
      descricao: entrega && tamanhos ? rotuloEntrega(entrega, kitCompleto(tamanhos)) : undefined,
    },
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
  reserva_entrega: perguntarEntrega,
  reserva_confirma: revisar,
  reserva_corrigir: perguntarCorrecao,
  reserva_outro: perguntarOutro,
  reserva_outra_escola: perguntarOutraEscola,
};

export function repetirPergunta(waId: string, passo: string, dados: Dados) {
  return (PERGUNTAS[passo] ?? perguntarEscola)(waId, dados);
}
