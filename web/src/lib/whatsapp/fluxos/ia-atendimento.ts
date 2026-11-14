import { abrirFila, registrarRespostaBot, TEXTO_FILA } from "../atendimento";
import { enviarBotoes, enviarTexto } from "../enviar";
import { lerBaseBot } from "../ia/base";
import { completar } from "../ia/claude";
import { consultarDisponibilidade, registrarAviso } from "../ia/ferramentas";
import { comHistorico, historicoDe, paraModelo } from "../ia/historico";
import { instrucoes, SAUDACAO, textoParaFamilia } from "../ia/regras";
import { ID } from "../intencao";
import type { ResultadoTurno, Sessao } from "../sessao";
import type { EntradaUsuario } from "../tipos";

const PASSO = "ia_atendimento";

type Turno = {
  waId: string;
  mensagemId: string;
  pergunta: string;
  emFila: boolean;
  chamouEquipe: boolean;
  erroFila: unknown;
};

/** Dados de outro fluxo não entram no histórico da IA. O rascunho da reserva volta pelo agente. */
function dadosDaIa(sessao: Sessao) {
  return sessao.passo.startsWith("ia_") ? sessao.dados : {};
}

export async function abrirIa(sessao: Sessao): Promise<ResultadoTurno> {
  await enviarBotoes(sessao.waId, SAUDACAO, [
    { id: ID.menuReservar, titulo: "Reservar uniforme" },
    { id: ID.iaPessoa, titulo: "Falar com pessoa" },
  ]);
  return {
    passo: PASSO,
    dados: comHistorico({}, [
      { papel: "usuario", texto: "Falar com atendente" },
      { papel: "loja", texto: SAUDACAO },
    ]),
  };
}

async function executar(turno: Turno, nome: string, entrada: Record<string, unknown>) {
  if (nome === "consultar_disponibilidade") return JSON.stringify(consultarDisponibilidade(entrada));
  if (nome === "registrar_aviso") return JSON.stringify(await registrarAviso(turno.waId, entrada));
  if (nome === "chamar_equipe") {
    try {
      if (!turno.emFila) await abrirFila(turno.waId, turno.mensagemId, turno.pergunta);
      turno.chamouEquipe = true;
    } catch (erro) {
      turno.erroFila = erro;
      return JSON.stringify({ ok: false, texto: "Não foi possível chamar a equipe." });
    }
    return JSON.stringify({
      ok: true,
      texto: "A equipe foi chamada. Diga em uma frase que alguém da loja vai responder por aqui. Não invente a resposta.",
    });
  }
  return JSON.stringify({ ok: false, texto: "Ferramenta desconhecida. Não invente o resultado." });
}

async function cairNaFila(waId: string, mensagemId: string, pergunta: string) {
  try {
    await abrirFila(waId, mensagemId, pergunta);
    await enviarTexto(waId, TEXTO_FILA);
  } catch (erro) {
    console.error("Falha ao abrir a fila do WhatsApp", erro);
    await enviarTexto(waId, "Não consegui chamar a equipe agora. Tente de novo em instantes.").catch(
      (falha) => console.error("Falha ao avisar a família", falha),
    );
  }
}

/** `emFila`: a equipe já foi chamada e ninguém assumiu. A IA responde só à dúvida. */
export async function continuarIa(
  sessao: Sessao,
  entrada: EntradaUsuario,
  emFila = false,
): Promise<ResultadoTurno> {
  const dados = dadosDaIa(sessao);
  const historico = historicoDe(dados);
  const pergunta = entrada.texto.trim();
  if (!pergunta) {
    await enviarTexto(sessao.waId, "Me conta por escrito o que você precisa.");
    return { passo: PASSO, dados };
  }

  const turno: Turno = {
    waId: sessao.waId,
    mensagemId: entrada.mensagemId,
    pergunta,
    emFila,
    chamouEquipe: false,
    erroFila: null,
  };
  try {
    const base = await lerBaseBot().catch((erro: unknown) => {
      console.error("Falha ao ler a base do bot", erro);
      return { texto: "", atualizadoEm: null, autor: "" };
    });
    const resultado = await completar({
      sistema: instrucoes(base.texto, emFila),
      mensagens: paraModelo(historico, pergunta),
      executar: (nome, valores) => executar(turno, nome, valores),
    });
    if (turno.erroFila) throw turno.erroFila;

    const texto = textoParaFamilia(resultado.texto);
    await enviarTexto(sessao.waId, texto);
    if (emFila || turno.chamouEquipe) {
      await registrarRespostaBot(sessao.waId, texto).catch((erro: unknown) =>
        console.error("Falha ao guardar a resposta da IA na fila", erro),
      );
    }
    return {
      passo: PASSO,
      dados: comHistorico(dados, [
        ...historico,
        { papel: "usuario", texto: pergunta },
        { papel: "loja", texto },
      ]),
    };
  } catch (erro) {
    console.error("Falha no atendimento por IA", { waId: sessao.waId, erro });
    await cairNaFila(sessao.waId, entrada.mensagemId, pergunta);
    return { passo: PASSO, dados };
  }
}
