import { CATALOGO, TAMANHOS } from "@/data/catalogo";
import { contarAnunciosAtivos } from "@/lib/comandos/doacao";
import { executorDoAgente } from "@/lib/comandos/executor";
import { lerPerfilLeve } from "@/lib/comandos/perfil";
import { nomeDoModelo } from "@/lib/doacao/modelos";
import { enviarBotoes, enviarLista, enviarTexto } from "../enviar";
import {
  detectarModelo,
  detectarTamanho,
  ID,
  idAnuncio,
} from "../intencao";
import { dadoTexto, type ResultadoTurno, type Sessao } from "../sessao";
import type { EntradaUsuario } from "../tipos";
import {
  cadastrarEspera,
  enviarFotos,
  mostrarOpcoes,
  mostrarUma,
  nudgeCompra,
  pedir,
  verTodas,
} from "./procuro-acoes";
import { garantirConta } from "./procuro-conta";

export async function iniciarProcuro(
  sessao: Sessao,
  modelo?: string | null,
): Promise<ResultadoTurno> {
  const dados = modelo ? { modelo } : {};
  if (modelo) {
    return perguntarTamanho({ ...sessao, dados }, modelo);
  }
  await enviarLista(
    sessao.waId,
    "Claro! 😊 Vou procurar as peças disponíveis para você.\n\nO que você precisa?",
    "Escolher peça",
    CATALOGO.map((item) => ({
      id: `${ID.pecaPrefixo}${item.id}`,
      titulo: item.name,
      descricao: item.hint,
    })),
  );
  return { passo: "procuro_peca", dados };
}

export async function continuarProcuro(
  sessao: Sessao,
  entrada: EntradaUsuario,
): Promise<ResultadoTurno> {
  const { escolha, texto } = entrada;
  const t = texto.trim();

  if (escolha === ID.avisar) return cadastrarEspera(sessao);
  if (escolha === ID.comprar) return nudgeCompra(sessao);
  if (escolha === ID.verTodas) return verTodas(sessao);
  if (escolha === ID.verWa) return enviarFotos(sessao, aposFiltro);

  if (sessao.passo === "procuro_sem") {
    const tMin = t.toLowerCase();
    if (tMin.includes("avisar") || tMin.includes("espera")) {
      return cadastrarEspera(sessao);
    }
    if (tMin.includes("comprar") || tMin.includes("nova")) {
      return nudgeCompra(sessao);
    }
  }

  const verId = idAnuncio(escolha, ID.verPrefixo);
  if (verId) return mostrarUma(sessao, verId, aposFiltro);

  const pedirId = idAnuncio(escolha, ID.pedirPrefixo);
  if (pedirId) return pedir(sessao, pedirId, mostrarOpcoesComFiltro);

  switch (sessao.passo) {
    case "procuro_peca":
      return receberPeca(sessao, escolha, t);
    case "procuro_tamanho":
      return receberTamanho(sessao, escolha, t);
    case "procuro_nome":
      return receberNome(sessao, t);
    case "procuro_escola":
      return receberEscola(sessao, t);
    default:
      await enviarTexto(
        sessao.waId,
        "Não entendi. Use os botões acima ou digite *menu* para recomeçar.",
      );
      return { passo: sessao.passo, dados: sessao.dados };
  }
}

function mostrarOpcoesComFiltro(sessao: Sessao) {
  return mostrarOpcoes(sessao, aposFiltro);
}

async function receberPeca(
  sessao: Sessao,
  escolha: string | null,
  texto: string,
): Promise<ResultadoTurno> {
  const modelo = detectarModelo(escolha, texto);
  if (!modelo) {
    await enviarTexto(
      sessao.waId,
      "Escolha uma peça da lista, por favor. Se não aparecer, abra *Ver opções*.",
    );
    return iniciarProcuro(sessao);
  }
  return perguntarTamanho(sessao, modelo);
}

async function perguntarTamanho(
  sessao: Sessao,
  modelo: string,
): Promise<ResultadoTurno> {
  const dados = { ...sessao.dados, modelo };
  await enviarLista(
    sessao.waId,
    `Perfeito, ${nomeDoModelo(modelo).toLowerCase()}. Qual tamanho?`,
    "Escolher tamanho",
    TAMANHOS.map((tam) => ({
      id: `${ID.tamPrefixo}${tam}`,
      titulo: `Tamanho ${tam}`,
    })),
  );
  return { passo: "procuro_tamanho", dados };
}

async function receberTamanho(
  sessao: Sessao,
  escolha: string | null,
  texto: string,
): Promise<ResultadoTurno> {
  const tamanho = detectarTamanho(escolha, texto);
  if (!tamanho) {
    await enviarTexto(
      sessao.waId,
      "Me diga o tamanho: 4, 6, 8, 10, 12, 14 ou 16.",
    );
    return { passo: "procuro_tamanho", dados: sessao.dados };
  }
  return aposFiltro({ ...sessao, dados: { ...sessao.dados, tamanho } });
}

async function aposFiltro(sessao: Sessao): Promise<ResultadoTurno> {
  const modelo = dadoTexto(sessao.dados, "modelo");
  const tamanho = dadoTexto(sessao.dados, "tamanho");
  const total = await contarAnunciosAtivos({ modelo, tamanho });
  const dados = { ...sessao.dados, total };

  if (total === 0) {
    await enviarBotoes(
      sessao.waId,
      `Neste momento não encontrei nenhuma ${nomeDoModelo(modelo).toLowerCase()} tamanho ${tamanho} disponível para doação. 😕\n\nPosso fazer duas coisas por você:`,
      [
        { id: ID.avisar, titulo: "Me avisar" },
        { id: ID.comprar, titulo: "Ver peça nova" },
      ],
    );
    return { passo: "procuro_sem", dados };
  }

  await enviarTexto(
    sessao.waId,
    `Ótima notícia! 🎉\n\nTemos ${total} ${nomeDoModelo(modelo).toLowerCase()}${total === 1 ? "" : "s"} tamanho ${tamanho} cadastrada${total === 1 ? "" : "s"} atualmente.`,
  );
  return pedirCadastroSeFaltar({ ...sessao, dados });
}

async function pedirCadastroSeFaltar(sessao: Sessao): Promise<ResultadoTurno> {
  const perfil = sessao.perfilId
    ? await lerPerfilLeve(executorDoAgente(sessao.perfilId))
    : null;

  if (!perfil?.nome) {
    await enviarTexto(
      sessao.waId,
      "Antes de mostrar as fotos, vou fazer seu cadastro gratuito na Rede Circular. É bem rápido.\n\nQual seu nome?",
    );
    return { passo: "procuro_nome", dados: sessao.dados };
  }
  if (!perfil.temFilho) {
    await enviarTexto(
      sessao.waId,
      `Obrigado, ${perfil.nome.split(" ")[0]}. E em qual escola a criança estuda?`,
    );
    return {
      passo: "procuro_escola",
      dados: { ...sessao.dados, nome: perfil.nome },
    };
  }
  return mostrarOpcoes(
    { ...sessao, dados: { ...sessao.dados, escola: perfil.filhoEscola ?? "" } },
    aposFiltro,
  );
}

async function receberNome(sessao: Sessao, texto: string): Promise<ResultadoTurno> {
  const nome = texto.trim();
  if (nome.length < 3) {
    await enviarTexto(sessao.waId, "Me diga seu nome completo, por favor.");
    return { passo: "procuro_nome", dados: sessao.dados };
  }
  await enviarTexto(
    sessao.waId,
    `Obrigado, ${nome.split(/\s+/)[0]}. E em qual escola a criança estuda?`,
  );
  return { passo: "procuro_escola", dados: { ...sessao.dados, nome } };
}

async function receberEscola(
  sessao: Sessao,
  texto: string,
): Promise<ResultadoTurno> {
  const escola = texto.trim();
  if (escola.length < 2) {
    await enviarTexto(sessao.waId, "Qual o nome da escola?");
    return { passo: "procuro_escola", dados: sessao.dados };
  }
  const conta = await garantirConta({
    ...sessao,
    dados: { ...sessao.dados, escola },
  });
  if (!conta.ok) return conta.turno;
  return mostrarOpcoes(conta.sessao, aposFiltro);
}
