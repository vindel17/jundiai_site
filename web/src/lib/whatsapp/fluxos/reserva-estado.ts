import { eTamanhoKit, pecasDoKit, type KitGenero, type PecaKit, type TamanhosKit } from "@/lib/reserva/kit";
import { origemDireta, type Origem } from "@/lib/reserva/origem";
import { dadoTexto, type ResultadoTurno, type Sessao } from "../sessao";

export const ESC = "reserva.esc.";
export const KIT_M = "reserva.kit.masculino";
export const KIT_F = "reserva.kit.feminino";
export const MODO_UNICO = "reserva.modo.unico";
export const MODO_PECA = "reserva.modo.peca";
export const MODO_AJUDA = "reserva.modo.ajuda";
export const AJUDA = "reserva.ajuda.";
export const AJUDA_OUTRA = "reserva.ajuda_outra";
export const AJUDA_FIM = "reserva.ajuda_fim";
export const CONFIRMA = "reserva.confirma";
export const CORRIGIR = "reserva.corrigir";
export const COR = "reserva.cor.";
export const OUTRO_SIM = "reserva.outro.sim";
export const OUTRO_NAO = "reserva.outro.nao";
export const MESMA_ESCOLA = "reserva.escola.mesma";
export const OUTRA_ESCOLA = "reserva.escola.outra";
export const RETOMAR = "reserva.retomar";
export const RECOMECAR = "reserva.recomecar";

/** Campo em correção: depois de respondido, a conversa volta ao resumo. */
export type CampoCorrecao = "escola" | "aluno" | "kit" | "peca";

const RASCUNHO = "reservaRascunho";
const PASSOS_CONCLUIDOS = ["reserva_retomar", "reserva_outro", "reserva_outra_escola"];

export type Rascunho = { passo: string; dados: Record<string, unknown> };

export function origemDosDados(dados: Record<string, unknown>): Origem {
  const canal = dadoTexto(dados, "origemCanal");
  if (
    canal === "panfleto" ||
    canal === "social" ||
    canal === "pago" ||
    canal === "indicacao" ||
    canal === "direto"
  ) {
    return {
      canal,
      codigo: dadoTexto(dados, "origemCodigo"),
      texto: dadoTexto(dados, "origemTexto"),
    };
  }
  return origemDireta();
}

export function guardarOrigem(origem: Origem) {
  return {
    origemCanal: origem.canal,
    origemCodigo: origem.codigo,
    origemTexto: origem.texto,
  };
}

export function escolasDosDados(dados: Record<string, unknown>) {
  const valor = dados.escolas;
  return Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === "string")
    : [];
}

export function kitDosDados(dados: Record<string, unknown>): KitGenero {
  return dadoTexto(dados, "kit") === "feminino" ? "feminino" : "masculino";
}

/** `null` enquanto faltar o tamanho de alguma peça. */
export function tamanhosDosDados(dados: Record<string, unknown>): TamanhosKit | null {
  const tamanhos: Partial<TamanhosKit> = {};
  for (const peca of pecasDoKit(kitDosDados(dados))) {
    const valor = dadoTexto(dados, peca.chave);
    if (!eTamanhoKit(valor)) return null;
    tamanhos[peca.chave] = valor;
  }
  return tamanhos as TamanhosKit;
}

export function pecaAtual(dados: Record<string, unknown>): PecaKit {
  const chave = dadoTexto(dados, "peca");
  const pecas = pecasDoKit(kitDosDados(dados));
  return pecas.find((peca) => peca.chave === chave) ?? pecas[0];
}

export function corrigindo(dados: Record<string, unknown>) {
  return Boolean(dadoTexto(dados, "corrigindo"));
}

export function semChave(dados: Record<string, unknown>, chave: string) {
  const resto = { ...dados };
  delete resto[chave];
  return resto;
}

export function semCorrecao(dados: Record<string, unknown>) {
  return semChave(dados, "corrigindo");
}

export function lerRascunho(dados: Record<string, unknown>): Rascunho | null {
  const valor = dados[RASCUNHO];
  if (typeof valor !== "object" || valor === null) return null;
  const { passo, dados: salvos } = valor as Partial<Rascunho>;
  if (typeof passo !== "string" || typeof salvos !== "object" || salvos === null) {
    return null;
  }
  return { passo, dados: salvos };
}

function rascunhoDaSessao(sessao: Sessao): Rascunho | null {
  if (!sessao.passo.startsWith("reserva_")) return lerRascunho(sessao.dados);
  if (sessao.passo === "reserva_retomar") return lerRascunho(sessao.dados);
  if (PASSOS_CONCLUIDOS.includes(sessao.passo)) return null;
  const comecou = dadoTexto(sessao.dados, "escola") || dadoTexto(sessao.dados, "aluno");
  return comecou ? { passo: sessao.passo, dados: sessao.dados } : null;
}

/**
 * Quem sai da reserva no meio (menu, outra opção) não perde o que já escolheu.
 * O rascunho viaja nos dados dos outros fluxos até a família voltar a reservar.
 */
export function manterRascunho(antes: Sessao, turno: ResultadoTurno): ResultadoTurno {
  if (turno.passo.startsWith("reserva_")) return turno;
  const rascunho = rascunhoDaSessao(antes);
  if (!rascunho) return turno;
  return { ...turno, dados: { ...turno.dados, [RASCUNHO]: rascunho } };
}

export function comRascunho(dados: Record<string, unknown>, rascunho: Rascunho) {
  return { ...dados, [RASCUNHO]: rascunho };
}
