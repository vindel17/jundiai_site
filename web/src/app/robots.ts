import type { MetadataRoute } from "next";
import { DOMINIO_PADRAO } from "@/lib/config-publica";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `https://${DOMINIO_PADRAO}/sitemap.xml`,
  };
}
