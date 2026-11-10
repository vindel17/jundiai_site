import { CANAIS_ORIGEM, type CanalOrigem } from "@/lib/reserva/origem";

export type ParametrosOrigem = {
  origem?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type OrigemSite = { canal: CanalOrigem; codigo: string };

const MEIOS_PAGOS = /^(cpc|ppc|paid|paid[-_ ]?social|ads?|display)$/;

export function origemSiteDireta(): OrigemSite {
  return { canal: "direto", codigo: "" };
}

export function temOrigem(parametros: ParametrosOrigem) {
  return Boolean(
    parametros.origem?.trim() ||
      parametros.utmSource?.trim() ||
      parametros.utmMedium?.trim() ||
      parametros.utmCampaign?.trim(),
  );
}

/**
 * Traduz o link de chegada para os mesmos cinco canais da reserva.
 * `?origem=` com um canal conhecido vale mais que o UTM; anúncio pago vem do
 * `utm_medium`; qualquer outra fonte com UTM conta como rede social.
 */
export function origemDoSite(parametros: ParametrosOrigem): OrigemSite {
  const codigo = (parametros.utmCampaign ?? "").trim().slice(0, 40);
  const origem = (parametros.origem ?? "").trim().toLowerCase();
  if ((CANAIS_ORIGEM as readonly string[]).includes(origem)) {
    return { canal: origem as CanalOrigem, codigo };
  }
  const meio = (parametros.utmMedium ?? "").trim().toLowerCase();
  if (MEIOS_PAGOS.test(meio)) return { canal: "pago", codigo };
  if ((parametros.utmSource ?? "").trim()) return { canal: "social", codigo };
  return origemSiteDireta();
}

/** Cookie `uj_o`: "canal|codigo". Volta como direto se vier alterado. */
export function lerCookieOrigem(valor: string | undefined): OrigemSite {
  const [canal, codigo = ""] = (valor ?? "").split("|");
  if ((CANAIS_ORIGEM as readonly string[]).includes(canal)) {
    return { canal: canal as CanalOrigem, codigo: codigo.slice(0, 40) };
  }
  return origemSiteDireta();
}

export function textoCookieOrigem(origem: OrigemSite) {
  return `${origem.canal}|${origem.codigo}`;
}
