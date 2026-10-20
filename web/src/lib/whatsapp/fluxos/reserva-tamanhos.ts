import { fotoDaPeca } from "@/lib/reserva/fotos";
import { SEM_PECA, pecasDoKit, proximaPeca, tamanhoKit } from "@/lib/reserva/kit";
import { textoMedidas } from "@/lib/reserva/medidas";
import { enviarBotoes, enviarImagem, enviarTexto } from "../enviar";
import { ID } from "../intencao";
import type { ResultadoTurno, Sessao } from "../sessao";
import { urlSite } from "../site";
import type { EntradaUsuario } from "../tipos";
import {
  AJUDA,
  AJUDA_FIM,
  AJUDA_OUTRA,
  ENTREGA_CASA,
  ENTREGA_LOJA,
  MODO_AJUDA,
  MODO_PECA,
  MODO_UNICO,
  SEM,
  kitDosDados,
  pecaAtual,
  semCorrecao,
} from "./reserva-estado";
import {
  perguntarAjuda,
  perguntarEntrega,
  perguntarModo,
  perguntarPeca,
  perguntarTamanhoUnico,
  revisar,
  seguir,
} from "./reserva-perguntas";

type Dados = Record<string, unknown>;

export function tamanhoDaEntrada(entrada: EntradaUsuario) {
  const bruto = entrada.escolha?.startsWith(ID.tamPrefixo)
    ? entrada.escolha.slice(ID.tamPrefixo.length)
    : entrada.texto;
  return tamanhoKit(bruto);
}

function mesmoTamanho(dados: Dados, tamanho: string): Dados {
  const tamanhos = Object.fromEntries(
    pecasDoKit(kitDosDados(dados)).map((peca) => [peca.chave, tamanho]),
  );
  return { ...dados, ...tamanhos };
}

export async function passoModo(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const texto = entrada.texto.toLowerCase();
  const tamanho = entrada.escolha ? null : tamanhoDaEntrada(entrada);
  if (tamanho) return revisar(sessao.waId, mesmoTamanho(sessao.dados, tamanho));
  if (entrada.escolha === MODO_UNICO || /tudo|um tamanho/.test(texto)) {
    return perguntarTamanhoUnico(sessao.waId, sessao.dados);
  }
  if (entrada.escolha === MODO_PECA || /pe[cç]a/.test(texto)) {
    const primeira = pecasDoKit(kitDosDados(sessao.dados))[0];
    return perguntarPeca(sessao.waId, { ...sessao.dados, peca: primeira.chave });
  }
  if (entrada.escolha === MODO_AJUDA || /ajuda|medida/.test(texto)) {
    return perguntarAjuda(sessao.waId, sessao.dados);
  }
  return perguntarModo(sessao.waId, sessao.dados);
}

export async function passoTamanhoUnico(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  const tamanho = tamanhoDaEntrada(entrada);
  if (!tamanho) return perguntarTamanhoUnico(sessao.waId, sessao.dados);
  return revisar(sessao.waId, mesmoTamanho(sessao.dados, tamanho));
}

export function semEstaPeca(entrada: EntradaUsuario) {
  return entrada.escolha === SEM || /n[aã]o quero|sem (essa|esta)|pular/i.test(entrada.texto);
}

export async function passoTamanho(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const peca = pecaAtual(sessao.dados);
  const tamanho = semEstaPeca(entrada) ? SEM_PECA : tamanhoDaEntrada(entrada);
  if (!tamanho) return perguntarPeca(sessao.waId, sessao.dados);

  const dados = { ...sessao.dados, [peca.chave]: tamanho };
  return seguir(sessao.waId, dados, () => {
    const seguinte = proximaPeca(peca.chave);
    if (!seguinte) return revisar(sessao.waId, dados);
    return perguntarPeca(sessao.waId, { ...dados, peca: seguinte });
  });
}

async function mostrarMedidas(waId: string, dados: Dados, chave: string) {
  const peca = pecasDoKit(kitDosDados(dados)).find((item) => item.chave === chave);
  if (!peca) return perguntarAjuda(waId, dados);
  const foto = fotoDaPeca(peca);
  if (foto) await enviarImagem(waId, urlSite(foto), peca.nome);
  await enviarTexto(waId, textoMedidas(peca));
  await enviarBotoes(waId, "Quer consultar outra peça ou escolher os tamanhos?", [
    { id: AJUDA_OUTRA, titulo: "Ver outra peça" },
    { id: AJUDA_FIM, titulo: "Escolher tamanhos" },
  ]);
  return { passo: "reserva_ajuda", dados };
}

/** "Ver outra peça" ou qualquer resposta solta volta para a lista de peças. */
export async function passoAjuda(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const escolha = entrada.escolha ?? "";
  if (escolha.startsWith(AJUDA)) {
    return mostrarMedidas(sessao.waId, sessao.dados, escolha.slice(AJUDA.length));
  }
  if (escolha === AJUDA_FIM) return perguntarModo(sessao.waId, sessao.dados);
  return perguntarAjuda(sessao.waId, sessao.dados);
}

export function entregaEscolhida(entrada: EntradaUsuario) {
  const texto = entrada.texto.toLowerCase();
  if (entrada.escolha === ENTREGA_CASA || /casa|entreg/.test(texto)) return "casa";
  if (entrada.escolha === ENTREGA_LOJA || /loja|retir/.test(texto)) return "loja";
  return null;
}

export async function passoEntrega(sessao: Sessao, entrada: EntradaUsuario): Promise<ResultadoTurno> {
  const entrega = entregaEscolhida(entrada);
  if (!entrega) return perguntarEntrega(sessao.waId, sessao.dados);
  return revisar(sessao.waId, semCorrecao({ ...sessao.dados, entrega }));
}
