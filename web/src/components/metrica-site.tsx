"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { registrarEtapaSite } from "@/lib/metrica/cliente";
import { temOrigem } from "@/lib/metrica/origem-site";
import { readTrackingFromSearch } from "@/lib/utm";

/** Conta visitas ao site e à página de reserva. Não aparece na tela. */
export function MetricaSite() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/equipe")) return;
    const chegada = readTrackingFromSearch(new URLSearchParams(window.location.search));
    const origem = {
      origem: chegada.origem,
      utmSource: chegada.utmSource,
      utmMedium: chegada.utmMedium,
      utmCampaign: chegada.utmCampaign,
    };
    registrarEtapaSite("visita_site", origem, temOrigem(origem));
    if (pathname.startsWith("/reserva")) registrarEtapaSite("visita_reserva");
  }, [pathname]);

  return null;
}
