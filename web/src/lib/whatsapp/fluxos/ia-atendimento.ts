import { abrirFila, TEXTO_FILA } from "../atendimento";
import { enviarBotoes, enviarTexto } from "../enviar";
import { ID } from "../intencao";
import type { ResultadoTurno, Sessao } from "../sessao";
import type { EntradaUsuario } from "../tipos";
import { lerBaseBot } from "../ia/base";
import { completar } from "../ia/claude";
import { consultarDisponibilidade, registrarAviso } from "../ia/ferramentas";
import { instrucoes, SAUDACAO, textoParaFamilia } from "../ia/regras";

const HISTORICO = "iaHistorico";
const MAXIMO = 8;

type Turno = { papel: "usuario" | "loja"; texto: string };
type MensagemModelo = { role: "user" | "assistant"; content: string };

function historicoDe(dados: Record<string, unknown>): Turno[] {
  const valor = dados[HISTORICO];
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const turno = item as Partial<Turno>;
    if ((turno.papel !== "usuario" && turno.papel !== "loja") || typeof turno.texto !== "string") {
      return [];
    }
    const texto = turno.texto.trim();
    return texto ? [{ papel: turno.papel, texto: texto.slice(0, 500) }] : [];
  }).slice(-MAXIMO);
}

function comHistorico(dados: Record<string, unknown>, turnos: Turno[]) {
  return { ...dados, [HISTORICO]: turnos.slice(-MAXIMO) };
}

function paraModelo(turnos: Turno[], pergunta: string): MensagemModelo[] {
  const lista: MensagemModelo[] = turnos.map((turno) => ({
    role: turno.papel === "loja" ? "assistant" : "user",
    content: turno.texto,
  }));
  const ultima = lista[lista.length - 1];
  if (ultima?.role === "user") ultima.content = `${ultima.content}\n${pergunta}`;
  else lista.push({ role: "user", content: pergunta });
  return lista;
}

async function executar(waId: string, nome: string, entrada: Record<string, unknown>) {
  if (nome === "consultar_disponibilidade") return JSON.stringify(consultarDisponibilidade(entrada));
  if (nome === "registrar_aviso") return JSON.stringify(await registrarAviso(waId, entrada));
  return JSON.stringify({ ok: false, texto: "Ferramenta desconhecida. Não invente o resultado." });
}

async function cairNaFila(waId: string, entrada: EntradaUsuario) {
  try {
    await abrirFila(waId, entrada.mensagemId, entrada.texto);
    await enviarTexto(waId, TEXTO_FILA);
  } catch (erro) {
    console.error("Falha ao abrir a fila do WhatsApp", erro);
    await enviarTexto(waId, "Não consegui chamar a equipe agora. Tente de novo em instantes.").catch(
      (falha) => console.error("Falha ao avisar a família", falha),
    );
  }
}

export async function continuarIa(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const historico = historicoDe(sessao.dados);
  if (entrada.escolha === ID.menuAtendente && historico.length === 0) {
    await enviarBotoes(sessao.waId, SAUDACAO, [
      { id: ID.menuReservar, titulo: "Reservar uniforme" },
      { id: ID.iaPessoa, titulo: "Falar com pessoa" },
    ]);
    return {
      passo: "ia_atendimento",
      dados: comHistorico(sessao.dados, [
        { papel: "usuario", texto: "Falar com atendente" },
        { papel: "loja", texto: SAUDACAO },
      ]),
    };
  }

  const pergunta = entrada.texto.trim();
  if (!pergunta) {
    await enviarTexto(sessao.waId, "Me conta por escrito o que você precisa.");
    return { passo: "ia_atendimento", dados: sessao.dados };
  }

  try {
    const base = await lerBaseBot().catch((erro: unknown) => {
      console.error("Falha ao ler a base do bot", erro);
      return { texto: "", atualizadoEm: null, autor: "" };
    });
    const resultado = await completar({
      sistema: instrucoes(base.texto),
      mensagens: paraModelo(historico, pergunta),
      executar: (nome, dados) => executar(sessao.waId, nome, dados),
    });
    const texto = textoParaFamilia(resultado.texto);
    await enviarTexto(sessao.waId, texto);
    return {
      passo: "ia_atendimento",
      dados: comHistorico(sessao.dados, [
        ...historico,
        { papel: "usuario", texto: pergunta },
        { papel: "loja", texto },
      ]),
    };
  } catch (erro) {
    console.error("Falha no atendimento por IA", { waId: sessao.waId, erro });
    await cairNaFila(sessao.waId, entrada);
    return { passo: "ia_atendimento", dados: sessao.dados };
  }
}
