"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CATALOGO } from "@/data/catalogo";
import { primeiroNome } from "@/lib/avaliacoes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EstadoAvaliacao = { erro?: string; ok?: boolean };

const modeloIds = CATALOGO.map((item) => item.id) as [string, ...string[]];

const schema = z.object({
  modeloId: z.enum(modeloIds),
  nota: z.coerce.number().int().min(1).max(5),
  comentario: z
    .string()
    .trim()
    .min(10, "Escreva pelo menos 10 caracteres")
    .max(500, "Comentário pode ter no máximo 500 caracteres"),
  confirmouCompra: z.literal("sim", {
    error: "Confirme que você já comprou esta peça conosco",
  }),
  fotosPaths: z
    .string()
    .optional()
    .default("[]")
    .transform((raw, ctx) => {
      try {
        const parsed = JSON.parse(raw || "[]") as unknown;
        if (!Array.isArray(parsed)) throw new Error("invalid");
        const paths = parsed.filter((p): p is string => typeof p === "string");
        if (paths.length > 3) {
          ctx.addIssue({
            code: "custom",
            message: "Envie no máximo 3 fotos.",
          });
          return z.NEVER;
        }
        return paths;
      } catch {
        ctx.addIssue({ code: "custom", message: "Fotos inválidas." });
        return z.NEVER;
      }
    }),
});

export async function criarAvaliacao(
  _anterior: EstadoAvaliacao,
  formData: FormData,
): Promise<EstadoAvaliacao> {
  const analise = schema.safeParse({
    modeloId: formData.get("modeloId"),
    nota: formData.get("nota"),
    comentario: formData.get("comentario"),
    confirmouCompra: formData.get("confirmouCompra"),
    fotosPaths: formData.get("fotosPaths") ?? "[]",
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Entre com seu WhatsApp para avaliar." };

  const { data: perfil } = await supabase
    .from("perfil")
    .select("nome_responsavel")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.nome_responsavel?.trim()) {
    return {
      erro: "Complete seu nome na conta antes de avaliar.",
    };
  }

  const dados = analise.data;
  const prefixo = `${user.id}/`;

  for (const path of dados.fotosPaths) {
    if (!path.startsWith(prefixo) || path.includes("..")) {
      return { erro: "Fotos inválidas." };
    }
  }

  const { data: criada, error: erroInsert } = await supabase
    .from("avaliacao")
    .insert({
      perfil_id: user.id,
      modelo_id: dados.modeloId,
      autor_nome: primeiroNome(perfil.nome_responsavel),
      nota: dados.nota,
      comentario: dados.comentario,
      status: "aprovada",
      compra_verificada: false,
    })
    .select("id")
    .single();

  if (erroInsert) {
    if (erroInsert.code === "23505") {
      return { erro: "Você já avaliou esta peça." };
    }
    return { erro: "Não conseguimos salvar sua avaliação. Tente de novo." };
  }

  const avaliacaoId = criada.id as string;

  if (dados.fotosPaths.length > 0) {
    const { error: erroFotos } = await supabase.from("avaliacao_foto").insert(
      dados.fotosPaths.map((storage_path) => ({
        avaliacao_id: avaliacaoId,
        storage_path,
      })),
    );

    if (erroFotos) {
      await supabase.from("avaliacao").delete().eq("id", avaliacaoId);
      return { erro: "Não conseguimos salvar as fotos. Tente de novo." };
    }
  }

  revalidatePath("/comprar");
  revalidatePath("/conta");
  revalidatePath("/conta/avaliar");
  return { ok: true };
}
