import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { SITE } from "@/lib/constants";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e6fd6",
};

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE.domain}`),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: `${SITE.brandLine}. Uniformes escolares da rede municipal de ${SITE.city} com preço de inauguração.`,
  openGraph: {
    title: SITE.name,
    description: `Monte o pedido do uniforme escolar em ${SITE.city} — condição de lançamento.`,
    url: `https://${SITE.domain}`,
    siteName: SITE.name,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AnalyticsScripts />
        <a href="#conteudo" className="uj-skip">
          Ir direto ao conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
