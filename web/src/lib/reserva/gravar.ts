import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { escolaValida } from "./escolas";
import { eTamanhoKit, pecasDoKit, type KitGenero, type TamanhosKit } from "./kit";
import { type CanalOrigem, type Origem } from "./origem";

const DUPLICADO = "23505";

export type ReservaNova = {
  telefone: string;
  origem: Origem;
  escola: string;
  aluno: string;
  kit: KitGenero;
  tamanhos: TamanhosKit;
};

export type ReservaGravada = {
  id: string;
  codigoIndicacao: string;
};

function telefone(valor: string) {
  return valor.replace(/\D/g, "");
}

async function codigoLivre(codigo: string) {
  const db = createSupabaseAdminClient();
  const [familia, perfil] = await Promise.all([
    db
      .from("reserva_familia")
      .select("telefone")
      .eq("codigo_indicacao", codigo)
      .maybeSingle(),
    db.from("perfil").select("id").eq("codigo_indicacao", codigo).maybeSingle(),
  ]);
  return !familia.data && !perfil.data;
}

async function garantirFamilia(numero: string) {
  const db = createSupabaseAdminClient();
  const existente = await db
    .from("reserva_familia")
    .select("codigo_indicacao")
    .eq("telefone", numero)
    .maybeSingle();
  if (existente.data?.codigo_indicacao) {
    return existente.data.codigo_indicacao as string;
  }

  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const codigo = randomBytes(4).toString("hex");
    if (!(await codigoLivre(codigo))) continue;
    const { error } = await db
      .from("reserva_familia")
      .insert({ telefone: numero, codigo_indicacao: codigo });
    if (!error) return codigo;
    if (error.code !== DUPLICADO) {
      throw new Error(error.message);
    }
    const deNovo = await db
      .from("reserva_familia")
      .select("codigo_indicacao")
      .eq("telefone", numero)
      .maybeSingle();
    if (deNovo.data?.codigo_indicacao) {
      return deNovo.data.codigo_indicacao as string;
    }
  }

  throw new Error("Não gerou o link de indicação.");
}

async function padrinho(origem: Origem, numero: string) {
  if (origem.canal !== "indicacao" || !/^[a-z0-9]{8}$/.test(origem.codigo)) {
    return null;
  }
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("reserva_familia")
    .select("telefone")
    .eq("codigo_indicacao", origem.codigo)
    .maybeSingle();
  const telefonePadrinho = (data?.telefone as string | undefined) ?? null;
  if (!telefonePadrinho || telefonePadrinho === numero) return null;
  return telefonePadrinho;
}

export async function gravarReserva(entrada: ReservaNova): Promise<ReservaGravada> {
  const numero = telefone(entrada.telefone);
  const aluno = entrada.aluno.trim().slice(0, 40);
  if (!numero || aluno.length < 2) throw new Error("Reserva incompleta.");
  if (!escolaValida(entrada.escola)) throw new Error("Escola fora da lista.");
  if (pecasDoKit(entrada.kit).some((peca) => !eTamanhoKit(entrada.tamanhos[peca.chave]))) {
    throw new Error("Tamanho inválido.");
  }

  const db = createSupabaseAdminClient();
  const codigo = await garantirFamilia(numero);
  const desde = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recente = await db
    .from("reserva")
    .select("id")
    .eq("telefone", numero)
    .eq("escola", entrada.escola)
    .eq("aluno_nome", aluno)
    .eq("kit", entrada.kit)
    .eq("tamanho_curta", entrada.tamanhos.curta)
    .eq("tamanho_longa", entrada.tamanhos.longa)
    .eq("tamanho_inferior", entrada.tamanhos.inferior)
    .eq("tamanho_calca", entrada.tamanhos.calca)
    .eq("tamanho_blusa", entrada.tamanhos.blusa)
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recente.data?.id) {
    return { id: recente.data.id as string, codigoIndicacao: codigo };
  }

  const canal: CanalOrigem = entrada.origem.canal;
  const { data, error } = await db
    .from("reserva")
    .insert({
      telefone: numero,
      origem_canal: canal,
      origem_codigo: entrada.origem.codigo.slice(0, 40),
      origem_texto: entrada.origem.texto.slice(0, 200),
      indicado_por_telefone: await padrinho(entrada.origem, numero),
      escola: entrada.escola,
      aluno_nome: aluno,
      kit: entrada.kit,
      tamanho_curta: entrada.tamanhos.curta,
      tamanho_longa: entrada.tamanhos.longa,
      tamanho_inferior: entrada.tamanhos.inferior,
      tamanho_calca: entrada.tamanhos.calca,
      tamanho_blusa: entrada.tamanhos.blusa,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Não gravei a reserva.");
  return { id: data.id as string, codigoIndicacao: codigo };
}
