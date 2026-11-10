"use client";

import { useEffect, useRef, useState } from "react";

type Estado = "carregando" | "pronto" | "sem-ar" | "falhou";

type ElementoModelViewer = HTMLElement & { canActivateAR: boolean };

type Props = {
  src: string;
  alt: string;
};

const MENSAGENS: Record<Exclude<Estado, "pronto">, string> = {
  carregando: "Carregando o gabarito…",
  "sem-ar": "Este aparelho ou navegador não abre o gabarito em realidade aumentada.",
  falhou: "Não foi possível abrir a câmera em realidade aumentada. Tente de novo.",
};

/**
 * Gabarito em escala real (1:1) no chão. `ar-scale="fixed"` impede o
 * cliente de redimensionar com pinça no Quick Look e no Scene Viewer.
 */
export function GabaritoAr({ src, alt }: Props) {
  const ref = useRef<ElementoModelViewer>(null);
  const [estado, setEstado] = useState<Estado>("carregando");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ativo = true;

    const aoCarregar = () => setEstado(el.canActivateAR ? "pronto" : "sem-ar");
    const aoStatus = (e: Event) => {
      if ((e as CustomEvent<{ status: string }>).detail.status === "failed") setEstado("falhou");
    };
    el.addEventListener("load", aoCarregar);
    el.addEventListener("ar-status", aoStatus);

    import("@google/model-viewer").catch(() => {
      if (ativo) setEstado("sem-ar");
    });

    return () => {
      ativo = false;
      el.removeEventListener("load", aoCarregar);
      el.removeEventListener("ar-status", aoStatus);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <model-viewer
        ref={ref}
        src={src}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        ar-placement="floor"
        camera-controls
        camera-orbit="0deg 0deg auto"
        style={{ position: "relative", display: "block", width: "100%", height: 320, background: "var(--bg-alt)", borderRadius: 12 }}
      >
        <button slot="ar-button" type="button" className="btn-primary" style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
          Abrir no chão em tamanho real
        </button>
      </model-viewer>
      {estado !== "pronto" && (
        <p role="status" className="text-sm" style={{ color: "var(--muted)" }}>
          {MENSAGENS[estado]}
        </p>
      )}
    </div>
  );
}
