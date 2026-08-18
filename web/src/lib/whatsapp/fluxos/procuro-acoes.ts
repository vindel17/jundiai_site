import {
  listarAnunciosAtivos,
  pedirPeca,
  salvarProcuro,
  type AnuncioAtivo,
} from "@/lib/comandos/doacao";
import { executorDoAgente } from "@/lib/comandos/executor";
import { lerPerfilLeve } from "@/lib/comandos/perfil";
import { urlFotoAnuncio } from "@/lib/doacao/foto";
import { nomeDoModelo } from "@/lib/doacao/modelos";
import { enviarBotoes, enviarImagem, enviarLista, enviarTexto } from "../enviar";
import { ID } from "../intencao";
import { dadoTexto, type ResultadoTurno, type Sessao } from "../sessao";
import { urlFeedDoacao, urlSite } from "../site";
import { garantirConta } from "./procuro-conta";

export async function mostrarOpcoes(
  sessao: Sessao,
  aposFiltro: (s: Sessao) => Promise<ResultadoTurno>,
): Promise<ResultadoTurno> {
  const modelo = dadoTexto(sessao.dados, "modelo");
  const tamanho = dadoTexto(sessao.dados, "tamanho");
  const escola = dadoTexto(sessao.dados, "escola");
  const lista = await listarAnunciosAtivos({
    modelo,
    tamanho,
    excluirPerfilId: sessao.perfilId ?? undefined,
    limite: 10,
  });

  if (lista.length === 0) return aposFiltro(sessao);

  const ordenada = escola
    ? [...lista].sort((a, b) => {
        const aOk = a.escola.toLowerCase().includes(escola.toLowerCase()) ? 0 : 1;
        const bOk = b.escola.toLowerCase().includes(escola.toLowerCase()) ? 0 : 1;
        return aOk - bOk;
      })
    : lista;

  const recorte = ordenada.slice(0, 3);
  const linhas = recorte.map((item, i) =>
    [
      `${nomeDoModelo(item.modelo_id)} ${item.tamanho} — opção ${i + 1}`,
      `${rotuloEstado(item.estado)} · ${item.escola}`,
    ].join("\n"),
  );

  await enviarLista(
    sessao.waId,
    `Pronto! 💙\n\nSeparei algumas opções para você:\n\n${linhas.join("\n\n")}\n\nQual gostaria de ver primeiro?`,
    "Ver opções",
    recorte.map((item, i) => ({
      id: `${ID.verPrefixo}${item.id}`,
      titulo: `Opção ${i + 1} · tam. ${item.tamanho}`,
      descricao: `${rotuloEstado(item.estado)} · ${item.escola}`,
    })),
  );
  await enviarBotoes(
    sessao.waId,
    `Quer visualizar todas as ${ordenada.length} opções com fotos?`,
    [
      { id: ID.verWa, titulo: "Ver pelo WhatsApp" },
      { id: ID.verTodas, titulo: "Ver todas no site" },
    ],
  );

  return {
    passo: "procuro_opcoes",
    dados: { ...sessao.dados, ids: recorte.map((item) => item.id) },
    perfilId: sessao.perfilId,
  };
}

export async function mostrarUma(
  sessao: Sessao,
  anuncioId: string,
  aposFiltro: (s: Sessao) => Promise<ResultadoTurno>,
): Promise<ResultadoTurno> {
  const lista = await listarAnunciosAtivos({
    modelo: dadoTexto(sessao.dados, "modelo"),
    tamanho: dadoTexto(sessao.dados, "tamanho"),
    limite: 60,
  });
  const item = lista.find((a) => a.id === anuncioId);
  if (!item) {
    await enviarTexto(sessao.waId, "Essa peça não está mais disponível.");
    return aposFiltro(sessao);
  }

  await enviarPeca(sessao.waId, item);
  await enviarBotoes(sessao.waId, "Quer pedir esta peça?", [
    { id: `${ID.pedirPrefixo}${item.id}`, titulo: "Pedir peça" },
    { id: ID.verTodas, titulo: "Ver no site" },
    { id: ID.verWa, titulo: "Outras fotos" },
  ]);
  return {
    passo: "procuro_ver",
    dados: { ...sessao.dados, anuncioId: item.id },
    perfilId: sessao.perfilId,
  };
}

export async function enviarFotos(
  sessao: Sessao,
  aposFiltro: (s: Sessao) => Promise<ResultadoTurno>,
): Promise<ResultadoTurno> {
  const lista = (
    await listarAnunciosAtivos({
      modelo: dadoTexto(sessao.dados, "modelo"),
      tamanho: dadoTexto(sessao.dados, "tamanho"),
      excluirPerfilId: sessao.perfilId ?? undefined,
      limite: 3,
    })
  ).slice(0, 3);

  if (lista.length === 0) return aposFiltro(sessao);

  for (const item of lista) {
    await enviarPeca(sessao.waId, item);
  }
  await enviarBotoes(
    sessao.waId,
    "Para pedir, abra a opção na lista anterior ou veja todas no site.",
    [
      { id: `${ID.pedirPrefixo}${lista[0].id}`, titulo: "Pedir a 1ª" },
      { id: ID.verTodas, titulo: "Ver no site" },
    ],
  );
  return {
    passo: "procuro_opcoes",
    dados: sessao.dados,
    perfilId: sessao.perfilId,
  };
}

export async function pedir(
  sessao: Sessao,
  anuncioId: string,
  mostrarDeNovo: (s: Sessao) => Promise<ResultadoTurno>,
): Promise<ResultadoTurno> {
  const conta = await garantirConta(sessao);
  if (!conta.ok) return conta.turno;
  const { sessao: pronta } = conta;

  const leve = await lerPerfilLeve(executorDoAgente(pronta.perfilId!));
  if (!leve.temFilho) {
    await enviarTexto(
      pronta.waId,
      "Para pedir a peça preciso da escola da criança. Qual o nome da escola?",
    );
    return {
      passo: "procuro_escola",
      dados: { ...pronta.dados, anuncioId },
      perfilId: pronta.perfilId,
    };
  }

  const resultado = await pedirPeca(executorDoAgente(pronta.perfilId!), anuncioId);
  if (!resultado.ok) {
    await enviarTexto(pronta.waId, resultado.erro);
    return mostrarDeNovo(pronta);
  }

  await enviarTexto(
    pronta.waId,
    [
      "Pedido enviado! ✅",
      "",
      "O doador precisa aceitar. Aí o WhatsApp dos dois é liberado para combinar a retirada.",
      "",
      `Acompanhe: ${urlSite(`/doacao/pedido/${resultado.dados.doacaoId}`)}`,
    ].join("\n"),
    { preview: true },
  );
  return { passo: "menu", dados: {}, perfilId: pronta.perfilId };
}

export async function cadastrarEspera(sessao: Sessao): Promise<ResultadoTurno> {
  const conta = await garantirConta(sessao);
  if (!conta.ok) return conta.turno;
  const { sessao: pronta } = conta;

  const resultado = await salvarProcuro(executorDoAgente(pronta.perfilId!), {
    modelo: dadoTexto(pronta.dados, "modelo"),
    tamanho: dadoTexto(pronta.dados, "tamanho"),
    escola: dadoTexto(pronta.dados, "escola"),
  });
  if (!resultado.ok) {
    await enviarTexto(pronta.waId, resultado.erro);
    return { passo: "procuro_sem", dados: pronta.dados, perfilId: pronta.perfilId };
  }

  const modelo = dadoTexto(pronta.dados, "modelo");
  const tamanho = dadoTexto(pronta.dados, "tamanho");
  await enviarTexto(
    pronta.waId,
    [
      "Pronto! ✅",
      "",
      "Você entrou na lista de espera para:",
      `${nomeDoModelo(modelo)} tamanho ${tamanho}`,
      "",
      "Assim que uma peça compatível for cadastrada, eu te aviso por aqui.",
    ].join("\n"),
  );
  return { passo: "menu", dados: {}, perfilId: pronta.perfilId };
}

export async function nudgeCompra(sessao: Sessao): Promise<ResultadoTurno> {
  await enviarTexto(
    sessao.waId,
    [
      "Se precisar da peça para já, o uniforme novo está no site com preço de inauguração:",
      urlSite("/comprar"),
    ].join("\n"),
    { preview: true },
  );
  return { passo: "menu", dados: sessao.dados, perfilId: sessao.perfilId };
}

export async function verTodas(sessao: Sessao): Promise<ResultadoTurno> {
  await enviarTexto(
    sessao.waId,
    [
      "Aqui estão todas as opções com foto e filtro já aplicado:",
      urlFeedDoacao({
        modelo: dadoTexto(sessao.dados, "modelo") || undefined,
        tamanho: dadoTexto(sessao.dados, "tamanho") || undefined,
      }),
    ].join("\n"),
    { preview: true },
  );
  return { passo: sessao.passo, dados: sessao.dados, perfilId: sessao.perfilId };
}

async function enviarPeca(waId: string, item: AnuncioAtivo) {
  const foto = urlFotoAnuncio(item.foto_path);
  const legenda = [
    `${nomeDoModelo(item.modelo_id)} · tam. ${item.tamanho}`,
    `${rotuloEstado(item.estado)} · ${item.escola}`,
  ].join("\n");
  if (foto) {
    await enviarImagem(waId, foto, legenda);
    return;
  }
  await enviarTexto(waId, `${legenda}\n(sem foto)`);
}

function rotuloEstado(estado: AnuncioAtivo["estado"]) {
  return estado === "bom" ? "Bom estado" : "Sinais de uso";
}
