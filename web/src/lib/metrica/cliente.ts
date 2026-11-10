import type { EtapaDoNavegador } from "./etapas";
import type { ParametrosOrigem } from "./origem-site";

/**
 * Avisa o servidor que esta pessoa chegou a uma etapa. Só uma vez por sessão,
 * a menos que o link traga origem nova (anúncio, panfleto). Falha em silêncio.
 */
export function registrarEtapaSite(
  etapa: EtapaDoNavegador,
  origem?: ParametrosOrigem,
  repetir = false,
) {
  if (typeof window === "undefined") return;
  const chave = `uj_m_${etapa}`;
  try {
    if (!repetir && sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, "1");
  } catch {
    // Navegação privada pode bloquear o storage: o servidor ignora a repetição.
  }
  void fetch("/api/metrica", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ etapa, origem }),
    keepalive: true,
  }).catch(() => undefined);
}
