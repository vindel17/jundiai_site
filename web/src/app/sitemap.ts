import type { MetadataRoute } from "next";
import { DOMINIO_PADRAO } from "@/lib/config-publica";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/reserva", "/privacidade"].map((rota) => ({
    url: `https://${DOMINIO_PADRAO}${rota}`,
  }));
}
