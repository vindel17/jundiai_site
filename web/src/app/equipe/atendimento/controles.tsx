"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

export function AtualizarFila() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [router]);

  return null;
}

export function BotaoAtendimento({ rotulo, principal = false }: { rotulo: string; principal?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={principal ? "btn-primary" : "btn-secondary"} disabled={pending}>
      {pending ? "Aguarde…" : rotulo}
    </button>
  );
}
