"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { codigoDoCookie } from "@/app/conta/indicacao-acoes";
import { COOKIE_INDICACAO } from "@/lib/indicacao/regras";
import { registrarEtapas } from "@/lib/metrica/registrar";
import { gravarPreferenciaVoucher } from "@/lib/reserva/aviso-voucher";
import {
  listarReservasDoTelefone,
  obterReserva,
  reservaDoTelefone,
  reservasAtivas,
  telefonesEquivalentes,
} from "@/lib/reserva/consultas";
import { eEntrega } from "@/lib/reserva/entrega";
import { escolaValida } from "@/lib/reserva/escolas";
import { gravarReserva } from "@/lib/reserva/gravar";
import { aplicarMudancaStatus } from "@/lib/reserva/mudanca";
import { origemDaReservaSite } from "@/lib/reserva/origem";
import { familiaPodeExcluir } from "@/lib/reserva/status";
import {
  reservaAberta,
  tamanhosDoFormulario,
  temAlgumaPeca,
  type KitGenero,
} from "@/lib/reserva/kit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { telefoneCanonico } from "@/lib/whatsapp/identidade";

export type EstadoReserva = { erro?: string };

async function telefoneDaConta(phone: string) {
  const variantes = telefonesEquivalentes(phone);
  if (variantes.length === 0) return "";

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("reserva_familia")
    .select("telefone")
    .in("telefone", variantes)
    .limit(1)
    .maybeSingle();
  if (data?.telefone) return data.telefone as string;

  return (telefoneCanonico(phone) ?? phone).replace(/\D/g, "");
}

export async function criarReservaSite(
  _estado: EstadoReserva,
  formData: FormData,
): Promise<EstadoReserva> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.phone) redirect("/entrar?proximo=/reserva");
  if (!reservaAberta()) return { erro: "O prazo da reserva terminou em 31 de dezembro." };

  const escola = String(formData.get("escola") ?? "");
  const aluno = String(formData.get("aluno") ?? "").trim().replace(/\s+/g, " ");
  const kitBruto = String(formData.get("kit") ?? "");
  const kit: KitGenero | null =
    kitBruto === "feminino" || kitBruto === "masculino" ? kitBruto : null;
  const tamanhos = tamanhosDoFormulario(formData);
  const entrega = String(formData.get("entrega") ?? "");

  if (!escolaValida(escola)) return { erro: "Escolha a escola na lista." };
  if (aluno.length < 2) return { erro: "Informe o primeiro nome do(a) aluno(a)." };
  if (!kit) return { erro: "Escolha o kit com bermuda ou com short-saia." };
  if (!tamanhos) return { erro: "Escolha o tamanho de cada peça." };
  if (!temAlgumaPeca(tamanhos)) return { erro: "Escolha ao menos uma peça para reservar." };
  if (!eEntrega(entrega)) return { erro: "Diga se prefere receber em casa ou retirar na loja." };

  const telefone = await telefoneDaConta(user.phone);
  if (!telefone) return { erro: "Não encontramos o WhatsApp desta conta." };

  const origem = origemDaReservaSite(await conviteDeOutraFamilia(telefone));

  try {
    if (formData.get("avisoVoucher") === "sim") {
      await gravarPreferenciaVoucher(user.phone, true, "site");
    }
    await gravarReserva({
      telefone,
      origem,
      escola,
      aluno: aluno.slice(0, 40),
      kit,
      tamanhos,
      entrega,
    });
  } catch {
    return { erro: "Não consegui anotar a reserva. Tente de novo." };
  }

  const jar = await cookies();
  jar.delete({ name: COOKIE_INDICACAO, path: "/" });

  await registrarEtapas({
    canal: "site",
    pessoa: telefone,
    etapas: ["confirmada"],
    origem,
  });
  redirect("/reserva?feita=1");
}

export async function mudarAvisoVoucher(
  _estado: EstadoReserva,
  formData: FormData,
): Promise<EstadoReserva> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.phone) redirect("/entrar?proximo=/reserva");
  const escolha = formData.get("avisoVoucher");
  if (escolha !== "sim" && escolha !== "nao") return { erro: "Escolha uma opção." };

  try {
    if (escolha === "sim" && reservasAtivas((await listarReservasDoTelefone(user.phone)).linhas).length === 0) {
      return { erro: "Faça uma pré-reserva para receber o aviso." };
    }
    await gravarPreferenciaVoucher(user.phone, escolha === "sim", "site");
  } catch {
    return { erro: "Não consegui salvar sua preferência. Tente de novo." };
  }
  revalidatePath("/reserva");
  return {};
}

/** O cookie do convite só vale quando o código é de outra família. */
async function conviteDeOutraFamilia(telefone: string) {
  const codigo = await codigoDoCookie();
  if (!codigo) return "";

  const variantes = telefonesEquivalentes(telefone);
  const db = createSupabaseAdminClient();
  const [familia, perfil] = await Promise.all([
    db.from("reserva_familia").select("telefone").eq("codigo_indicacao", codigo).maybeSingle(),
    db.from("perfil").select("telefone").eq("codigo_indicacao", codigo).maybeSingle(),
  ]);
  const dono = String(familia.data?.telefone ?? perfil.data?.telefone ?? "");
  if (dono && telefonesEquivalentes(dono).some((item) => variantes.includes(item))) return "";
  return codigo;
}

export type EstadoExclusao = { erro?: string };

const ID_RESERVA = /^[0-9a-f-]{36}$/i;

/** Cancela a reserva desta conta. Ela sai da página e fica cancelada para a equipe. */
export async function excluirReserva(
  _estado: EstadoExclusao,
  formData: FormData,
): Promise<EstadoExclusao> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.phone) redirect("/entrar?proximo=/conta");

  const id = String(formData.get("id") ?? "");
  if (!ID_RESERVA.test(id)) return { erro: "Reserva inválida." };

  const reserva = await obterReserva(id);
  if (!reserva || !reservaDoTelefone(reserva.telefone, user.phone)) {
    return { erro: "Não encontrei essa reserva nesta conta." };
  }
  if (!familiaPodeExcluir(reserva.status)) {
    return { erro: "Essa reserva já entrou em produção. Para cancelar, fale com a equipe." };
  }

  try {
    const resultado = await aplicarMudancaStatus(
      [id],
      "cancelada",
      "família",
      "Excluiu a reserva pelo site.",
    );
    if (!resultado[0]?.mudou) return { erro: "Não consegui excluir a reserva. Tente de novo." };
  } catch {
    return { erro: "Não consegui excluir a reserva. Tente de novo." };
  }

  revalidatePath("/conta");
  revalidatePath("/reserva");
  return {};
}
