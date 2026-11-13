import type { Metadata } from "next";
import { MedirComCartao } from "./medir-com-cartao";

export const metadata: Metadata = {
  title: "Medir as peças do kit com um cartão",
  robots: { index: false, follow: false },
};

/** Página interna (sem link no site) para validar a medição por foto com cartão de referência. */
export default function MedirComCartaoPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="section-block">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4">
        <p className="eyebrow">Teste interno</p>
        <h1 className="section-title">Medir as peças do kit com um cartão</h1>
        <p>
          Duas fotos cobrem o kit inteiro: uma camiseta e uma bermuda ou calça que servem bem no(a) aluno(a).
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          As fotos são medidas no próprio aparelho. Elas não são enviadas nem guardadas.
        </p>
        <MedirComCartao />
      </div>
    </main>
  );
}
