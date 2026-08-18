import Link from "next/link";
import { SITE } from "@/lib/constants";

const MOSAIC_COLORS = [
  "#8e3aa8",
  "#2a9fd8",
  "#ffc425",
  "#1e6fd6",
  "#e8503a",
  "#3d9b4f",
  "#f28c1e",
  "#2a9fd8",
  "#ffc425",
  "#1a7d68",
  "#b83a8c",
  "#f26522",
] as const;

export function MosaicStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mosaic-strip mosaic-strip-compact" : "mosaic-strip"} aria-hidden>
      {MOSAIC_COLORS.map((color, index) => (
        <span key={index} style={{ background: color }} />
      ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <MosaicStrip />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-10 text-sm sm:px-6">
        <p className="font-medium text-[var(--ink)]">{SITE.name}</p>
        <p className="text-[var(--muted)]">{SITE.brandLine}.</p>
        <p className="text-xs text-[var(--muted)]">
          Não somos o site da Prefeitura, da Secretaria de Educação ou das escolas
          municipais de {SITE.city}.
        </p>
        <Link href="/privacidade" className="w-fit underline underline-offset-2">
          Política de privacidade
        </Link>
      </div>
    </footer>
  );
}
