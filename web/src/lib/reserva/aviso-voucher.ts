import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarTemplate } from "@/lib/whatsapp/enviar";
import { ErroRespostaWhatsApp, whatsappConfigurado } from "@/lib/whatsapp/graph";
import { telefoneCanonico } from "@/lib/whatsapp/identidade";
import type { StatusEntrega } from "@/lib/whatsapp/tipos";

export const TEXTO_AVISO_VOUCHER = [
  "Olá! Aqui é a Uniforme Jundiaí. Você pediu para receber uma atualização sobre a sua pré-reserva de uniforme escolar de 2027.",
  "O voucher da Prefeitura de Jundiaí já está disponível para uso. Você pode consultar sua pré-reserva em https://uniformejundiai.com.br/reserva ou tirar dúvidas respondendo por aqui.",
  "Para parar de receber avisos, responda PARAR.",
].join("\n\n");

const PREFIXO = "voucher_2027:";
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const SITUACOES = { sent: "enviado", delivered: "entregue", read: "entregue", failed: "erro" } as const;

type Resumo = {
  familias: number;
  sem_aceite: number;
  a_preparar: number;
  pendentes: number;
  enviados: number;
  entregues: number;
  falhas: number;
  recusados: number;
  em_envio: number;
  incertos: number;
};

type Aviso = { id: string; destino: string };
type SituacaoEnvio = "enviado" | "entregue" | "erro" | "incerto";

function modeloVoucher() {
  return process.env.WHATSAPP_VOUCHER_TEMPLATE?.trim() === "voucher_2027_liberado"
    ? "voucher_2027_liberado"
    : null;
}

export function envioVoucherConfigurado() {
  return Boolean(modeloVoucher() && whatsappConfigurado() && process.env.WHATSAPP_APP_SECRET);
}

export async function resumoAvisoVoucher(): Promise<Resumo> {
  const { data, error } = await createSupabaseAdminClient().rpc("resumo_aviso_voucher");
  if (error) throw error;
  return data as Resumo;
}

export async function prepararAvisoVoucher(autor: string, quantidade: number): Promise<number> {
  const { data, error } = await createSupabaseAdminClient().rpc("preparar_aviso_voucher", {
    p_autor: autor,
    p_quantidade: quantidade,
  });
  if (error) throw error;
  return data as number;
}

export async function proximoLoteVoucher(): Promise<string[]> {
  const { data, error } = await createSupabaseAdminClient().rpc("proximo_lote_aviso_voucher");
  if (error) throw error;
  return data as string[];
}

export async function recolocarAvisosRecusados(autor: string): Promise<number> {
  const { data, error } = await createSupabaseAdminClient().rpc("recolocar_aviso_voucher", {
    p_autor: autor,
  });
  if (error) throw error;
  return data as number;
}

export async function lerPreferenciaVoucher(telefone: string): Promise<boolean | null> {
  const canonico = telefoneCanonico(telefone)?.slice(1);
  if (!canonico) return null;
  const { data, error } = await createSupabaseAdminClient()
    .from("reserva_aviso_preferencia")
    .select("aceita")
    .eq("telefone", canonico)
    .maybeSingle();
  if (error) throw error;
  return data?.aceita ?? null;
}

export async function gravarPreferenciaVoucher(
  telefone: string,
  aceita: boolean,
  canal: "site" | "whatsapp",
  registradaEm = new Date().toISOString(),
): Promise<boolean> {
  const numero = telefone.replace(/\D/g, "");
  const destino = /^55\d{10,11}$/.test(numero) ? numero : telefoneCanonico(telefone)?.slice(1);
  if (!destino) throw new Error("WhatsApp inválido para o aviso do voucher.");
  const { data, error } = await createSupabaseAdminClient().rpc("preferir_aviso_voucher", {
    p_destino: destino,
    p_aceita: aceita,
    p_canal: canal,
    p_registrado_em: registradaEm,
  });
  if (error) throw error;
  return data === true;
}

async function atualizarAviso(
  id: string | null,
  whatsappId: string,
  situacao: SituacaoEnvio,
  erro = "",
) {
  const { error } = await createSupabaseAdminClient().rpc("atualizar_aviso_voucher", {
    p_id: id,
    p_whatsapp_id: whatsappId,
    p_situacao: situacao,
    p_erro: erro,
  });
  if (error) throw error;
}

async function enviarAviso(aviso: Aviso, modelo: string) {
  let whatsappId: string;
  try {
    const resposta = await enviarTemplate(aviso.destino, modelo, [], {
      idioma: "pt_BR",
      referencia: PREFIXO + aviso.id,
      signal: AbortSignal.timeout(5000),
    });
    const id = resposta?.messages?.[0]?.id;
    if (typeof id !== "string" || !id) throw new Error("Meta não retornou o ID da mensagem.");
    whatsappId = id;
  } catch (erro) {
    // Após uma falha de transporte, a Meta pode ter aceitado a mensagem.
    const rejeitado = erro instanceof ErroRespostaWhatsApp && erro.status >= 400 && erro.status < 500;
    await atualizarAviso(
      aviso.id,
      "",
      rejeitado ? "erro" : "incerto",
      rejeitado ? `HTTP ${erro.status}` : "Resposta da Meta não confirmada",
    );
    // Pare o lote se o modelo não estiver disponível, houver limite ou a resposta for incerta.
    return !rejeitado || [401, 403, 404, 429].includes(erro.status) ||
      (erro.status === 400 && /"code"\s*:\s*13200[015]/.test(erro.message));
  }
  await atualizarAviso(aviso.id, whatsappId, "enviado");
  return false;
}

export async function enviarLoteVoucher(autor: string, ids: string[]) {
  const modelo = modeloVoucher();
  if (!modelo || !envioVoucherConfigurado()) throw new Error("Envio do voucher indisponível.");
  const db = createSupabaseAdminClient();
  let iniciados = 0;
  let interrompido = false;
  const selecionados = [...new Set(ids.filter((id) => UUID.test(id)))].slice(0, 40);
  for (let inicio = 0; inicio < selecionados.length && !interrompido; inicio += 8) {
    const { data, error } = await db.rpc("assumir_aviso_voucher", {
      p_autor: autor,
      p_ids: selecionados.slice(inicio, inicio + 8),
    });
    if (error) throw error;
    const avisos = data as Aviso[];
    if (avisos.length === 0) continue;
    const resultados = await Promise.allSettled(avisos.map((aviso) => enviarAviso(aviso, modelo)));
    interrompido = resultados.some((resultado) => resultado.status === "rejected" || resultado.value);
    iniciados += avisos.length;
  }
  return { iniciados, interrompido };
}

export async function registrarEntregaVoucher(evento: StatusEntrega) {
  if (evento.numeroId !== process.env.WHATSAPP_PHONE_NUMBER_ID) return;
  if (evento.referencia && !evento.referencia.startsWith(PREFIXO)) return;
  if (!evento.referencia && !modeloVoucher()) return;
  const id = evento.referencia.startsWith(PREFIXO) ? evento.referencia.slice(PREFIXO.length) : null;
  if (id !== null && !UUID.test(id)) return;

  await atualizarAviso(id, evento.id, SITUACOES[evento.status], evento.codigo ? `Meta ${evento.codigo}` : "");
}
