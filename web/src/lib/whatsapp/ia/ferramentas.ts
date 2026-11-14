import { CATALOGO, TAMANHOS } from "@/data/catalogo";
import { TAMANHOS_KIT } from "@/lib/reserva/kit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { consultarEstoqueTiny } from "./estoque-tiny";

const PECAS = new Set(CATALOGO.map((item) => item.id));
const GRADES = new Set<string>([...TAMANHOS, ...TAMANHOS_KIT]);

export const ESQUEMA_FERRAMENTAS = [
  {
    name: "consultar_disponibilidade",
    description:
      "Consulta a situação de uma peça e um tamanho. Use só com a peça específica e o tamanho. Não use para camiseta sem saber se é manga curta ou manga longa.",
    input_schema: {
      type: "object",
      properties: {
        peca: { type: "string", enum: [...PECAS] },
        tamanho: { type: "string", enum: [...GRADES] },
      },
      required: ["peca", "tamanho"],
    },
  },
  {
    name: "registrar_aviso",
    description:
      "Anota que esta conversa quer aviso no WhatsApp quando a equipe confirmar a peça e o tamanho. Chame só depois que a pessoa aceitar o aviso.",
    input_schema: {
      type: "object",
      properties: {
        peca: { type: "string", enum: [...PECAS] },
        tamanho: { type: "string", enum: [...GRADES] },
      },
      required: ["peca", "tamanho"],
    },
  },
];

function campos(entrada: Record<string, unknown>) {
  const peca = typeof entrada.peca === "string" ? entrada.peca : "";
  const tamanho = typeof entrada.tamanho === "string" ? entrada.tamanho : "";
  return PECAS.has(peca) && GRADES.has(tamanho) ? { peca, tamanho } : null;
}

/** A família só ouve o que o Tiny devolve. Sem a API, o retorno é não confirmar. */
export function consultarDisponibilidade(entrada: Record<string, unknown>) {
  if (!campos(entrada)) {
    return {
      situacao: "incompleta",
      texto: "Falta a peça exata ou o tamanho. Se for camiseta, pergunte se é manga curta ou manga longa. Não diga que tem nem que não tem.",
    };
  }
  return consultarEstoqueTiny();
}

export async function registrarAviso(waId: string, entrada: Record<string, unknown>) {
  const pedido = campos(entrada);
  if (!pedido) {
    return {
      anotado: false,
      texto: "Não anotei: falta a peça exata ou o tamanho. Pergunte de novo e não diga que tem estoque.",
    };
  }
  const { error } = await createSupabaseAdminClient().rpc("registrar_aviso_peca", {
    p_wa_id: waId,
    p_modelo: pedido.peca,
    p_tamanho: pedido.tamanho,
  });
  if (error) throw error;
  return {
    anotado: true,
    texto: "Aviso anotado. Diga que a loja avisa por este WhatsApp quando a equipe confirmar. O aviso ainda não é enviado sozinho.",
  };
}
