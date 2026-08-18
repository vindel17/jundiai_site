"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { executorDoUsuario } from "@/lib/comandos/executor";
import * as comandosPerfil from "@/lib/comandos/perfil";
import { COOKIE_INDICACAO, CODIGO_INDICACAO } from "@/lib/indicacao/regras";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EstadoResgate = { erro?: string; ok?: boolean };

export async function codigoDoCookie() {
  const jar = await cookies();
  const bruto = jar.get(COOKIE_INDICACAO)?.value ?? "";
  return CODIGO_INDICACAO.test(bruto) ? bruto : "";
}

export async function vincularIndicacaoDoCookie() {
  const codigo = await codigoDoCookie();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (codigo) {
    await supabase.rpc("vincular_indicacao", { p_codigo: codigo });
  }

  const jar = await cookies();
  jar.delete({ name: COOKIE_INDICACAO, path: "/" });
  revalidatePath("/conta");
}

export async function pedirResgate(
  _anterior: EstadoResgate,
  formData: FormData,
): Promise<EstadoResgate> {
  const endereco = String(formData.get("endereco") || "").trim();
  if (endereco.length < 10) {
    return { erro: "Informe rua, número, bairro e cidade." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("pedir_resgate", { p_endereco: endereco });
  if (error) {
    if (error.message.includes("camiseta")) {
      return { erro: "Ainda não há camiseta para resgatar." };
    }
    return { erro: "Não conseguimos registrar o pedido. Tente de novo." };
  }

  revalidatePath("/conta");
  return { ok: true };
}

export async function registrarCompra(valorCentavos: number) {
  const ex = await executorDoUsuario();
  if (!ex) return;
  await comandosPerfil.registrarCompra(ex, valorCentavos);
}
