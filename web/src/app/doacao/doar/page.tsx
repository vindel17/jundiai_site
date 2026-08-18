import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DoarForm } from "@/components/doacao/doar-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Doar uniforme",
};

export default async function DoarPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?proximo=/doacao/doar");

  const { count } = await supabase
    .from("filho")
    .select("id", { count: "exact", head: true })
    .eq("perfil_id", user.id);

  if (!count) redirect("/conta?proximo=/doacao/doar");

  return <DoarForm />;
}
