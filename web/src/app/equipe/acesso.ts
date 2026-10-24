import { redirect } from "next/navigation";
import {
  autorDoUsuario,
  equipeConfigurada,
  perfisDoUsuario,
  type PerfilEquipe,
} from "@/lib/reserva/equipe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AcessoEquipe =
  | { tipo: "sem-lista" }
  | { tipo: "fora" }
  | { tipo: "ok"; perfis: PerfilEquipe[]; autor: string };

export async function acessoEquipe(destino: string): Promise<AcessoEquipe> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/entrar?proximo=${encodeURIComponent(destino)}`);
  if (!equipeConfigurada()) return { tipo: "sem-lista" };
  const perfis = perfisDoUsuario(user);
  if (perfis.length === 0) return { tipo: "fora" };
  return { tipo: "ok", perfis, autor: autorDoUsuario(user) };
}
