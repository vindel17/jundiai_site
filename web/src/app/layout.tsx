import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { MetricaSite } from "@/components/metrica-site";
import { siteUrl } from "@/lib/config-publica";
import { SITE } from "@/lib/constants";
import "./globals.css";

const sans = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e6fd6",
};

// Enquanto o domínio final não estiver no ar, canônicas e preview social
// precisam apontar para a origem que realmente responde.
const origem = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(origem),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: `${SITE.brandLine}. ${SITE.credenciamento} de ${SITE.city}.`,
  openGraph: {
    title: SITE.name,
    description: `Monte o pedido do uniforme escolar em ${SITE.city} — condição de lançamento.`,
    url: origem,
    siteName: SITE.name,
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: "/marca/uniforme-jundiai.png",
    apple: "/marca/uniforme-jundiai.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AnalyticsScripts />
        <MetricaSite />
        <a href="#conteudo" className="uj-skip">
          Ir direto ao conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
