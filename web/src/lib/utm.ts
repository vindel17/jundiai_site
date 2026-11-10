import { registrarEtapaSite } from "@/lib/metrica/cliente";

export type TrackingParams = {
  origem: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

export function readTrackingFromSearch(
  searchParams: URLSearchParams,
): TrackingParams {
  return {
    origem: searchParams.get("origem") ?? "",
    utmSource: searchParams.get("utm_source") ?? "",
    utmMedium: searchParams.get("utm_medium") ?? "",
    utmCampaign: searchParams.get("utm_campaign") ?? "",
  };
}

export function trackEvent(
  name: string,
  payload?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };
  w.gtag?.("event", name, payload);
  w.fbq?.("trackCustom", name, payload);
  if (name === "click_whatsapp") registrarEtapaSite("clique_whatsapp");
}
