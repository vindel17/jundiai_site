export type TrackingParams = {
  origem: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

const KEY = "uj_tracking";

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

export function persistTracking(params: TrackingParams) {
  if (typeof window === "undefined") return;
  const hasAny = Object.values(params).some(Boolean);
  if (!hasAny) return;
  sessionStorage.setItem(KEY, JSON.stringify(params));
}

export function loadTracking(): TrackingParams {
  if (typeof window === "undefined") {
    return { origem: "", utmSource: "", utmMedium: "", utmCampaign: "" };
  }
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return { origem: "", utmSource: "", utmMedium: "", utmCampaign: "" };
    }
    return JSON.parse(raw) as TrackingParams;
  } catch {
    return { origem: "", utmSource: "", utmMedium: "", utmCampaign: "" };
  }
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
}
