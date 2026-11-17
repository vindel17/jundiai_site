import { revalidatePath } from "next/cache";
import { adminConfigurado, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { totalPublico } from "./contador";

export type ContadorKits = {
  sistema: number;
  fora: number;
  total: number;
};

export type LancamentoContador = {
  id: number;
  quantidade: number;
  nota: string;
  autor: string;
  criadoEm: string;
};

type AjusteLinha = {
  id: number;
  quantidade: number;
  nota: string;
  autor: string;
  criado_em: string;
};

async function lerSistemaEFora(): Promise<ContadorKits | null> {
  const db = createSupabaseAdminClient();
  const [reservas, ajustes] = await Promise.all([
    db.from("reserva").select("id", { count: "exact", head: true }),
    db.from("reserva_ajuste").select("quantidade"),
  ]);
  if (reservas.error) return null;

  const sistema = reservas.count ?? 0;
  if (ajustes.error) return { sistema, fora: 0, total: totalPublico(sistema, 0) };

  const fora = ((ajustes.data ?? []) as { quantidade: number }[]).reduce(
    (soma, linha) => soma + linha.quantidade,
    0,
  );
  return { sistema, fora, total: totalPublico(sistema, fora) };
}

/** Conta ao vivo para a equipe: reservas de qualquer status, mais os lançamentos. */
export async function lerContadorEquipe(): Promise<ContadorKits | null> {
  if (!adminConfigurado()) return null;
  return lerSistemaEFora();
}

export async function listarLancamentos(): Promise<LancamentoContador[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("reserva_ajuste")
    .select("id, quantidade, nota, autor, criado_em")
    .order("criado_em", { ascending: false })
    .limit(12);
  if (error) return [];

  return ((data ?? []) as AjusteLinha[]).map((linha) => ({
    id: linha.id,
    quantidade: linha.quantidade,
    nota: linha.nota,
    autor: linha.autor,
    criadoEm: linha.criado_em,
  }));
}

export async function lancarAjuste(quantidade: number, nota: string, autor: string) {
  const db = createSupabaseAdminClient();
  const { error } = await db.from("reserva_ajuste").insert({
    quantidade,
    nota: nota.trim().slice(0, 200),
    autor: autor.slice(0, 200),
  });
  if (error) throw new Error(error.message);
  atualizarContadorPublico();
}

export function atualizarContadorPublico() {
  try {
    revalidatePath("/");
    revalidatePath("/reserva");
  } catch (erro) {
    console.error("Falha ao atualizar o contador público", erro);
  }
}
