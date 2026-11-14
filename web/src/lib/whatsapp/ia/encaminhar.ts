import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { carregarConversa, salvarConversa } from "../conversa";
import { continuarIa } from "../fluxos/ia-atendimento";
import { manterRascunho } from "../fluxos/reserva-estado";
import type { Sessao } from "../sessao";

type Encaminhado = { wa_id: string; texto: string | null; na_janela: boolean };

/** Fecha a fila e deixa a IA responder à última mensagem da família, dentro da janela de 24 horas. */
export async function encaminharParaIa(id: string, autor: string) {
  const { data, error } = await createSupabaseAdminClient().rpc("encaminhar_atendimento_ia", {
    p_id: id,
    p_autor: autor,
  });
  if (error) throw error;
  const encaminhado = data as Encaminhado | null;
  if (!encaminhado?.wa_id) return "indisponivel" as const;

  const gravada = await carregarConversa(encaminhado.wa_id);
  const sessao: Sessao = {
    waId: encaminhado.wa_id,
    perfilId: gravada.perfilId,
    passo: gravada.passo,
    dados: gravada.dados,
  };

  if (!encaminhado.na_janela || !encaminhado.texto) {
    const turno = manterRascunho(sessao, {
      passo: "ia_atendimento",
      dados: sessao.passo.startsWith("ia_") ? sessao.dados : {},
    });
    await salvarConversa(sessao.waId, { passo: turno.passo, dados: turno.dados });
    return "ia_liberado" as const;
  }

  const turno = manterRascunho(sessao, await continuarIa(sessao, {
    mensagemId: randomUUID(),
    waId: sessao.waId,
    nome: null,
    tipo: "texto",
    texto: encaminhado.texto,
    escolha: null,
    midiaId: null,
  }));
  await salvarConversa(sessao.waId, { passo: turno.passo, dados: turno.dados });
  return "ia" as const;
}
