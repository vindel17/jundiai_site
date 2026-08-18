"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getWhatsAppUrl, SITE } from "@/lib/constants";
import { trackEvent } from "@/lib/utm";

const NAV = [
  { href: "/doacao/doar", label: "Doar" },
  { href: "/doacao/receber", label: "Receber" },
  { href: "/comprar", label: "Comprar" },
  { href: "/etiquetas", label: "Etiquetas" },
  { href: "/conta", label: "Minha conta" },
] as const;

const MOSAIC = [
  "#1e6fd6",
  "#2a9fd8",
  "#ffc425",
  "#f26522",
  "#3d9b4f",
  "#8e3aa8",
] as const;

// Do mais específico para o mais genérico: a primeira rota que casa vence.
const SUBTITULOS: readonly (readonly [string, string])[] = [
  ["/conta/avaliar", "Avaliar compra"],
  ["/conta", "Minha conta"],
  ["/comprar", "Loja de uniformes"],
  ["/pedido", "Loja de uniformes"],
  ["/doacao", "Doação de uniformes"],
  ["/etiquetas", "Etiquetas com o nome do aluno"],
  ["/entrar", "Entrar"],
  ["/i", "Convite"],
] as const;

export function WaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden width={size} height={size} fill="currentColor">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74 1.48.64 1.85.7 2.51.59.38-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.07-.1-.25-.17-.5-.29z" />
    </svg>
  );
}

export function useHelpWhatsApp(message?: string) {
  const href = getWhatsAppUrl(
    message ?? `Olá! Quero ajuda com o uniforme escolar em ${SITE.city}.`,
  );
  return { href, enabled: href !== "#" };
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subtituloDaRota(pathname: string) {
  const achado = SUBTITULOS.find(([rota]) => isActive(pathname, rota));
  return achado ? achado[1] : SITE.brandLine;
}

export function SiteTopbar() {
  const pathname = usePathname();
  const { href, enabled } = useHelpWhatsApp();

  return (
    <header className="uj-topbar">
      <div className="uj-topbar-inner">
        <Link href="/" className="uj-brand">
          <span className="uj-brand-badge">UJ</span>
          <span className="uj-brand-text">
            <span className="uj-brand-name">{SITE.name}</span>
            <span className="uj-brand-sub">{subtituloDaRota(pathname)}</span>
          </span>
        </Link>
        {enabled ? (
          <a
            className="uj-wa-link"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("click_whatsapp")}
          >
            <WaIcon size={16} /> Ajuda
          </a>
        ) : null}
      </div>
      <nav className="uj-nav" aria-label="Seções do site">
        {NAV.map((item) => {
          const ativo = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={ativo ? "true" : "false"}
              aria-current={ativo ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mosaic-strip mosaic-strip-compact" aria-hidden>
        {MOSAIC.map((color) => (
          <span key={color} style={{ background: color }} />
        ))}
      </div>
    </header>
  );
}

// `acimaDaBarra` sobe o botão quando a página tem barra fixa no rodapé (funil de pedido).
export function WhatsAppFab({ acimaDaBarra = false }: { acimaDaBarra?: boolean }) {
  const { href, enabled } = useHelpWhatsApp();
  if (!enabled) return null;

  return (
    <a
      className={acimaDaBarra ? "uj-fab" : "whatsapp-fab"}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      onClick={() => trackEvent("click_whatsapp")}
    >
      <WaIcon size={26} />
    </a>
  );
}
