import { siteUrl } from "@/lib/config-publica";
import { urlIndicacao } from "@/lib/indicacao/regras";
import { gravarReserva } from "@/lib/reserva/gravar";
import { pecasDoKit } from "@/lib/reserva/kit";
import { enviarTexto } from "../enviar";
import { mostrarMenu } from "../menu";
import { dadoTexto, type ResultadoTurno, type Sessao } from "../sessao";
import type { EntradaUsuario } from "../tipos";
import {
  CONFIRMA,
  COR,
  CORRIGIR,
  MESMA_ESCOLA,
  OUTRA_ESCOLA,
  OUTRO_NAO,
  OUTRO_SIM,
  entregaDosDados,
  guardarOrigem,
  kitDosDados,
  origemDosDados,
  semChave,
  tamanhosDosDados,
  type CampoCorrecao,
} from "./reserva-estado";
import {
  mostrarKits,
  perguntarCorrecao,
  perguntarEntrega,
  perguntarEscola,
  perguntarModo,
  perguntarNome,
  perguntarOutraEscola,
  perguntarOutro,
  perguntarPeca,
  revisar,
} from "./reserva-perguntas";

type Dados = Record<string, unknown>;

export async function passoConfirma(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  if (entrada.escolha === CORRIGIR) return perguntarCorrecao(sessao.waId, sessao.dados);
  if (entrada.escolha !== CONFIRMA) return revisar(sessao.waId, sessao.dados);

  const tamanhos = tamanhosDosDados(sessao.dados);
  if (!tamanhos) return perguntarModo(sessao.waId, sessao.dados);
  const entrega = entregaDosDados(sessao.dados);
  if (!entrega) return perguntarEntrega(sessao.waId, sessao.dados);
  const aluno = dadoTexto(sessao.dados, "aluno");

  let codigoIndicacao: string;
  try {
    const gravada = await gravarReserva({
      telefone: sessao.waId,
      origem: origemDosDados(sessao.dados),
      escola: dadoTexto(sessao.dados, "escola"),
      aluno,
      kit: kitDosDados(sessao.dados),
      tamanhos,
      entrega,
    });
    codigoIndicacao = gravada.codigoIndicacao;
  } catch (erro) {
    console.error("[reserva] falha ao gravar", erro);
    await enviarTexto(sessao.waId, "Não consegui anotar agora. Toque em Confirmar de novo.");
    return revisar(sessao.waId, sessao.dados);
  }

  const linhas = [
    `Pré-reserva de ${aluno} confirmada! ✅`,
    "",
    `O uniforme de ${aluno} fica garantido para o começo das aulas.`,
    "",
    "Não tem pagamento agora e não obriga a compra. Quando o kit estiver disponível, avisamos nesta conversa.",
  ];
  if (!sessao.dados.linkEnviado) {
    linhas.push(
      "",
      "Seu link para indicar outras famílias:",
      urlIndicacao(siteUrl(), codigoIndicacao),
      "",
      "Quando 3 famílias comprarem o kit completo por esse link, e você também comprar os kits reservados, você ganha uma camiseta extra por kit.",
    );
  }
  await enviarTexto(sessao.waId, linhas.join("\n"), { preview: true });

  return perguntarOutro(sessao.waId, {
    ...guardarOrigem(origemDosDados(sessao.dados)),
    escola: dadoTexto(sessao.dados, "escola"),
    entrega,
    linkEnviado: true,
  });
}

function campoEscolhido(escolha: string | null) {
  return escolha?.startsWith(COR) ? escolha.slice(COR.length) : "";
}

export async function passoCorrigir(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const campo = campoEscolhido(entrada.escolha);
  const marcar = (alvo: CampoCorrecao, extra: Dados = {}) => ({
    ...sessao.dados,
    ...extra,
    corrigindo: alvo,
  });

  if (campo === "escola") return perguntarEscola(sessao.waId, marcar("escola"));
  if (campo === "aluno") return perguntarNome(sessao.waId, marcar("aluno"));
  if (campo === "kit") return mostrarKits(sessao.waId, marcar("kit"));
  if (campo === "tamanhos") return perguntarModo(sessao.waId, sessao.dados);
  if (campo === "entrega") return perguntarEntrega(sessao.waId, marcar("entrega"));

  const peca = pecasDoKit(kitDosDados(sessao.dados)).find((item) => item.chave === campo);
  if (peca) return perguntarPeca(sessao.waId, marcar("peca", { peca: peca.chave }));
  return perguntarCorrecao(sessao.waId, sessao.dados);
}

export async function passoOutro(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  if (entrada.escolha === OUTRO_SIM) return perguntarOutraEscola(sessao.waId, sessao.dados);
  if (entrada.escolha === OUTRO_NAO) {
    await enviarTexto(
      sessao.waId,
      "Combinado! Quando o kit estiver disponível, avisamos nesta conversa. Para ver ou ajustar, toque em *Minhas reservas* no menu.",
    );
    return mostrarMenu(sessao);
  }
  return perguntarOutro(sessao.waId, sessao.dados);
}

export async function passoOutraEscola(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  if (entrada.escolha === MESMA_ESCOLA) return perguntarNome(sessao.waId, sessao.dados);
  if (entrada.escolha === OUTRA_ESCOLA) {
    return perguntarEscola(sessao.waId, semChave(sessao.dados, "escola"));
  }
  return perguntarOutraEscola(sessao.waId, sessao.dados);
}
