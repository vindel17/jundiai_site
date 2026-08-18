import { executorDoAgente } from "@/lib/comandos/executor";
import { completarLead } from "@/lib/comandos/perfil";
import { enviarTexto } from "../enviar";
import { criarPerfilParaWaId } from "../identidade";
import { dadoTexto, type ResultadoTurno, type Sessao } from "../sessao";

/**
 * Garante conta no mesmo banco do site. O telefone já está verificado pela
 * mensagem; nome e escola entram só se o fluxo tiver coletado.
 */
export async function garantirConta(
  sessao: Sessao,
): Promise<
  { ok: true; sessao: Sessao } | { ok: false; turno: ResultadoTurno }
> {
  let perfilId = sessao.perfilId;
  if (!perfilId) {
    perfilId = await criarPerfilParaWaId(sessao.waId);
  }
  if (!perfilId) {
    await enviarTexto(
      sessao.waId,
      "Não consegui criar seu cadastro agora. Tente de novo em instantes.",
    );
    return { ok: false, turno: { passo: sessao.passo, dados: sessao.dados } };
  }

  const resultado = await completarLead(executorDoAgente(perfilId), {
    nome: dadoTexto(sessao.dados, "nome"),
    escola: dadoTexto(sessao.dados, "escola"),
    tamanho: dadoTexto(sessao.dados, "tamanho"),
  });
  if (!resultado.ok) {
    await enviarTexto(sessao.waId, resultado.erro);
    return { ok: false, turno: { passo: sessao.passo, dados: sessao.dados } };
  }

  return { ok: true, sessao: { ...sessao, perfilId, dados: sessao.dados } };
}
