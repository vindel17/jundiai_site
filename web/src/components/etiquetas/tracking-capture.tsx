"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  persistTracking,
  readTrackingFromSearch,
  trackEvent,
} from "@/lib/utm";

export function TrackingCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = readTrackingFromSearch(searchParams);
    persistTracking(params);
    trackEvent("view_landing", {
      origem: params.origem || "direct",
    });
  }, [searchParams]);

  return null;
}
