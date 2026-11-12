import { executorDoAgente } from "@/lib/comandos/executor";
import { placarIndicacao } from "@/lib/comandos/perfil";
import { siteUrl } from "@/lib/config-publica";
import { faltamParaProximaCamiseta, textoPremioIndicacao, urlIndicacao } from "@/lib/indicacao/regras";
import { listarReservasDoTelefone } from "@/lib/reserva/consultas";
import { placarDaIndicacao } from "@/lib/reserva/indicacao";
import { enviarTexto } from "../enviar";
import { mostrarMenu } from "../menu";
import type { ResultadoTurno, Sessao } from "../sessao";
import { urlSite } from "../site";

export async function mostrarBeneficios(sessao: Sessao): Promise<ResultadoTurno> {
  if (!sessao.perfilId) {
    await enviarTexto(
      sessao.waId,
      [
        "Ainda não temos uma conta neste número.",
        "",
        "Entre no site com este WhatsApp para ver seu link de indicação:",
        urlSite("/entrar"),
      ].join("\n"),
      { preview: true },
    );
    return mostrarMenu(sessao);
  }

  const indicacao = await placarIndicacao(executorDoAgente(sessao.perfilId));
  const codigoPerfil = indicacao.ok ? (indicacao.dados?.codigo ?? "") : "";
  const familia = await listarReservasDoTelefone(sessao.waId).catch(() => ({ codigo: "" }));
  const codigo = familia.codigo || codigoPerfil;
  const link = codigo ? urlIndicacao(siteUrl(), codigo) : urlSite("/conta");
  const placar = codigo
    ? await placarDaIndicacao(sessao.waId, [familia.codigo, codigoPerfil]).catch(() => ({
        familias: 0,
        ultimaEm: null,
      }))
    : { familias: 0, ultimaEm: null };
  const faltam = faltamParaProximaCamiseta(placar.familias);
  const reservaram =
    placar.familias === 1
      ? "1 família já reservou pelo seu link."
      : `${placar.familias} famílias já reservaram pelo seu link.`;

  const linhas = [
    "Ganhe uma camiseta extra. 👕",
    "",
    textoPremioIndicacao(),
    "",
    placar.familias === 0
      ? "Ninguém reservou pelo seu link ainda. A primeira família já conta."
      : `${reservaram} Faltam ${faltam} para a próxima camiseta.`,
    "",
    link,
    "",
    `Acompanhe em ${urlSite("/conta")}`,
  ];

  await enviarTexto(sessao.waId, linhas.join("\n"), { preview: true });
  return mostrarMenu(sessao);
}
