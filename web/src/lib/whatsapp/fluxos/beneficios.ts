import { executorDoAgente } from "@/lib/comandos/executor";
import { placarDoacao } from "@/lib/comandos/doacao";
import { placarIndicacao } from "@/lib/comandos/perfil";
import { urlIndicacao, origemPublica } from "@/lib/indicacao/regras";
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
        "Procurar uma doação por aqui já cria seu cadastro. Ou entre no site:",
        urlSite("/entrar"),
      ].join("\n"),
      { preview: true },
    );
    return mostrarMenu(sessao);
  }

  const ex = executorDoAgente(sessao.perfilId);
  const [doacao, indicacao] = await Promise.all([
    placarDoacao(ex),
    placarIndicacao(ex),
  ]);

  const d = doacao.ok ? doacao.dados : null;
  const i = indicacao.ok ? indicacao.dados : null;
  const link = i?.codigo
    ? urlIndicacao(origemPublica(), i.codigo)
    : urlSite("/conta");

  const linhas = [
    "Aqui está seu saldo de benefícios. 💙",
    "",
    "♻️ Rede Circular",
    d
      ? `${d.contaveis} doação${d.contaveis === 1 ? "" : "ões"} concluída${d.contaveis === 1 ? "" : "s"} · ${d.pecas} camiseta${d.pecas === 1 ? "" : "s"} conquistada${d.pecas === 1 ? "" : "s"}`
      : "Ainda sem doações concluídas.",
    d && d.pecas === 0
      ? `Faltam ${d.faltam} para a próxima camiseta nova.`
      : null,
    "",
    "👨‍👩‍👧 Compartilhe e Ganhe",
    i
      ? `${i.acessos} acessos no seu link · ${i.cadastros} cadastros · ${i.camisetas} camiseta${i.camisetas === 1 ? "" : "s"}`
      : "Seu link aparece na conta depois do primeiro acesso.",
    "",
    `🔗 ${link}`,
    "",
    `Detalhes: ${urlSite("/conta")}`,
  ].filter((linha): linha is string => linha !== null);

  await enviarTexto(sessao.waId, linhas.join("\n"), { preview: true });
  return mostrarMenu(sessao);
}
