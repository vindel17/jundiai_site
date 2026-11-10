import { adminConfigurado, createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CanalOrigem } from "@/lib/reserva/origem";
import { pseudonimo, segredoDaMetrica } from "./anonimo";
import type { CanalMetrica } from "./etapas";

type Registro = {
  canal: CanalMetrica;
  /** Telefone (WhatsApp) ou cookie anônimo (site). Não é gravado como veio. */
  pessoa: string;
  etapas: readonly string[];
  origem: { canal: CanalOrigem; codigo: string };
};

let avisou = false;

/**
 * Anota as etapas que a pessoa alcançou. Quem já tinha chegado lá não muda.
 * Nunca lança erro: medir não pode derrubar o atendimento.
 */
export async function registrarEtapas(registro: Registro): Promise<void> {
  const segredo = segredoDaMetrica();
  if (!segredo || !adminConfigurado() || !registro.pessoa || registro.etapas.length === 0) return;

  try {
    const pessoa = pseudonimo(registro.pessoa, segredo);
    const { error } = await createSupabaseAdminClient()
      .from("metrica_evento")
      .upsert(
        registro.etapas.map((etapa) => ({
          canal: registro.canal,
          etapa,
          pessoa,
          origem_canal: registro.origem.canal,
          origem_codigo: registro.origem.codigo.slice(0, 40),
        })),
        { onConflict: "canal,etapa,pessoa", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
  } catch (erro) {
    if (avisou) return;
    avisou = true;
    console.warn("[metrica] não registrei o funil (migração 0012 aplicada?)", erro);
  }
}
