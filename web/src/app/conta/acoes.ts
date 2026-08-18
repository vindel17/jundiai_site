"use server";

import { revalidatePath } from "next/cache";
import { executorDoUsuario } from "@/lib/comandos/executor";
import * as perfil from "@/lib/comandos/perfil";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EstadoPerfil = { erro?: string; ok?: boolean; etiquetas?: number };

export async function salvarPerfil(
  _anterior: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const ex = await executorDoUsuario();
  if (!ex) return { erro: "Sessão expirada. Entre de novo." };

  const resultado = await perfil.salvarPerfil(ex, {
    nomeResponsavel: formData.get("nomeResponsavel"),
    filhoNome: formData.get("filhoNome"),
    filhoEscola: formData.get("filhoEscola"),
    filhoTamanho: formData.get("filhoTamanho"),
  });

  if (!resultado.ok) return { erro: resultado.erro };

  revalidatePath("/conta");
  return { ok: true, etiquetas: resultado.dados.etiquetas };
}

export async function sair() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
