"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TelaAviso } from "@/components/tela-aviso";

export default function Erro({ reset }: { reset: () => void }) {
  return (
    <AppShell>
      <TelaAviso
        titulo="Algo saiu do ar por aqui"
        acoes={
          <>
            <button type="button" className="btn-primary" onClick={reset}>
              Tentar de novo
            </button>
            <Link href="/" className="btn-secondary">
              Ir para o início
            </Link>
          </>
        }
      >
        <p>
          Não conseguimos carregar esta parte do site. Costuma ser instabilidade
          passageira: tentar de novo resolve na maioria das vezes.
        </p>
        <p>
          Se continuar assim, fale com a gente no WhatsApp pelo botão verde — a
          gente resolve por lá.
        </p>
      </TelaAviso>
    </AppShell>
  );
}
