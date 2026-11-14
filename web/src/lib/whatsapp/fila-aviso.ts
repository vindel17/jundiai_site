import { siteUrl, whatsappNumero } from "@/lib/config-publica";
import { telefonesComAcesso } from "@/lib/reserva/equipe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarTexto } from "./enviar";

/** Quem administra o atendimento, sem avisar o próprio cliente nem o número da loja. */
export function destinosDoAviso(cliente: string) {
  const proprio = cliente.replace(/\D/g, "");
  const loja = whatsappNumero();
  return telefonesComAcesso("atendimento").filter((telefone) => telefone !== proprio && telefone !== loja);
}

export function textoDoAviso(id: string | null, texto: string) {
  const trecho = texto.replace(/\s+/g, " ").trim().slice(0, 180);
  const base = `${siteUrl()}/equipe/atendimento`;
  const link = id ? `${base}?conversa=${id}` : base;
  return [`Nova conversa na fila do WhatsApp.`, trecho ? `"${trecho}"` : "", `Abrir: ${link}`]
    .filter(Boolean)
    .join("\n\n");
}

async function conversaAberta(waId: string) {
  const { data, error } = await createSupabaseAdminClient()
    .from("atendimento_whatsapp")
    .select("id")
    .eq("wa_id", waId)
    .is("encerrado_em", null)
    .maybeSingle();
  if (error) throw error;
  return typeof data?.id === "string" ? data.id : null;
}

/** Um aviso por conversa nova. Falha de envio não impede a resposta à família. */
export async function avisarFila(waId: string, texto: string) {
  const destinos = destinosDoAviso(waId);
  if (destinos.length === 0) return;

  let id: string | null = null;
  try {
    id = await conversaAberta(waId);
  } catch (erro) {
    console.error("Falha ao localizar a conversa para o aviso da fila", erro);
  }

  const aviso = textoDoAviso(id, texto);
  await Promise.all(
    destinos.map((destino) =>
      enviarTexto(destino, aviso).catch((erro: unknown) =>
        console.error("Falha ao avisar a equipe da fila", { destino: destino.slice(-4), erro }),
      ),
    ),
  );
}
