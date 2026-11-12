import { executorDoAgente } from "@/lib/comandos/executor";
import { placarIndicacao } from "@/lib/comandos/perfil";
import { siteUrl } from "@/lib/config-publica";
import { urlIndicacao } from "@/lib/indicacao/regras";
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
  const i = indicacao.ok ? indicacao.dados : null;
  const link = i?.codigo ? urlIndicacao(siteUrl(), i.codigo) : urlSite("/conta");

  const linhas = [
    "Aqui está seu saldo de benefícios. 💙",
    "",
    "👨‍👩‍👧 Compartilhe e Ganhe",
    i
      ? `${i.acessos} acessos no seu link · ${i.cadastros} cadastros · ${i.camisetas} camiseta${i.camisetas === 1 ? "" : "s"}`
      : "Seu link aparece na conta depois do primeiro acesso.",
    "",
    `🔗 ${link}`,
    "",
    `Detalhes: ${urlSite("/conta")}`,
  ];

  await enviarTexto(sessao.waId, linhas.join("\n"), { preview: true });
  return mostrarMenu(sessao);
}
