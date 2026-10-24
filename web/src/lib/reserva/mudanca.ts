import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { eStatusReserva, type StatusReserva } from "./status";

export type ReservaEvento = {
  id: number;
  statusDe: StatusReserva | null;
  statusPara: StatusReserva;
  autor: string;
  observacao: string;
  criadoEm: string;
};

type EventoBanco = {
  id: number;
  status_de: string | null;
  status_para: string;
  autor: string;
  observacao: string;
  criado_em: string;
};

export async function listarEventos(reservaId: string) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("reserva_evento")
    .select("id, status_de, status_para, autor, observacao, criado_em")
    .eq("reserva_id", reservaId)
    .order("criado_em", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return ((data ?? []) as EventoBanco[]).flatMap((row) => {
    if (!eStatusReserva(row.status_para)) return [];
    const de = row.status_de && eStatusReserva(row.status_de) ? row.status_de : null;
    return [
      {
        id: row.id,
        statusDe: de,
        statusPara: row.status_para,
        autor: row.autor,
        observacao: row.observacao,
        criadoEm: row.criado_em,
      },
    ];
  });
}

export async function statusDasReservas(ids: string[]) {
  if (ids.length === 0) return [] as { id: string; status: StatusReserva }[];
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("reserva").select("id, status").in("id", ids);
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: string; status: string }[]).flatMap((row) =>
    eStatusReserva(row.status) ? [{ id: row.id, status: row.status }] : [],
  );
}

export async function aplicarMudancaStatus(
  ids: string[],
  para: StatusReserva,
  autor: string,
  observacao: string,
) {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.rpc("mudar_status_reserva", {
    p_ids: ids,
    p_para: para,
    p_autor: autor,
    p_observacao: observacao,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; status_anterior: string; mudou: boolean }[];
}
