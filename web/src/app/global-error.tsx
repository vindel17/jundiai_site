"use client";

import "./globals.css";

/** Último recurso: erro no próprio layout raiz, então repetimos html/body. */
export default function ErroGlobal({ reset }: { reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <main className="uj-aviso">
          <h1>O site não conseguiu carregar</h1>
          <p>
            Tivemos uma falha inesperada. Recarregar a página costuma resolver.
          </p>
          <div className="uj-aviso-acoes">
            <button type="button" className="btn-primary" onClick={reset}>
              Recarregar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
