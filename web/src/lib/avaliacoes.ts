import { CATALOGO } from "@/data/catalogo";
import { SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AvaliacaoPublica,
  ResumoAvaliacao,
} from "@/types/avaliacao";

const MAX_LISTA = 24;

export function urlFotoAvaliacao(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/avaliacoes/${storagePath}`;
}

export function nomeModelo(modeloId: string): string {
  return CATALOGO.find((item) => item.id === modeloId)?.name ?? modeloId;
}

export function primeiroNome(nomeCompleto: string): string {
  const limpo = nomeCompleto.trim();
  if (!limpo) return "Família";
  return limpo.split(/\s+/)[0].slice(0, 40) || "Família";
}

type LinhaAvaliacao = {
  id: string;
  modelo_id: string;
  autor_nome: string;
  nota: number;
  comentario: string;
  compra_verificada: boolean;
  criado_em: string;
  fotos: { id: string; storage_path: string }[] | null;
};

function mapear(linha: LinhaAvaliacao): AvaliacaoPublica {
  return {
    id: linha.id,
    modelo_id: linha.modelo_id,
    nota: linha.nota,
    comentario: linha.comentario,
    compra_verificada: linha.compra_verificada,
    criado_em: linha.criado_em,
    autor_nome: linha.autor_nome,
    fotos: (linha.fotos ?? []).map((foto) => ({
      id: foto.id,
      storage_path: foto.storage_path,
      url: urlFotoAvaliacao(foto.storage_path),
    })),
  };
}

export async function listarAvaliacoesPublicas(
  modeloId?: string,
): Promise<AvaliacaoPublica[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("avaliacao")
    .select(
      `
      id,
      modelo_id,
      autor_nome,
      nota,
      comentario,
      compra_verificada,
      criado_em,
      fotos:avaliacao_foto ( id, storage_path )
    `,
    )
    .eq("status", "aprovada")
    .order("criado_em", { ascending: false })
    .limit(MAX_LISTA);

  if (modeloId) query = query.eq("modelo_id", modeloId);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as LinhaAvaliacao[]).map(mapear);
}

export async function listarResumosAvaliacao(): Promise<ResumoAvaliacao[]> {
  if (!supabaseConfigurado) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("resumo_avaliacoes");
  if (error || !data) return [];

  return (data as { modelo_id: string; media: number; total: number }[]).map(
    (row) => ({
      modelo_id: row.modelo_id,
      media: Number(row.media),
      total: Number(row.total),
    }),
  );
}

export function mediaGeral(resumos: ResumoAvaliacao[]): {
  media: number;
  total: number;
} {
  const total = resumos.reduce((sum, r) => sum + r.total, 0);
  if (total === 0) return { media: 0, total: 0 };
  const soma = resumos.reduce((sum, r) => sum + r.media * r.total, 0);
  return { media: Math.round((soma / total) * 10) / 10, total };
}
