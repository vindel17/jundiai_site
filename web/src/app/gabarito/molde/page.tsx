import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TAMANHOS_CAMISETA_ADULTO, tabelaCamisetaAdulto } from "@/lib/gabarito/camiseta-adulto";
import { CadastroMolde } from "./cadastro-molde";

export const metadata: Metadata = {
  title: "Molde da camiseta a partir de foto",
  robots: { index: false, follow: false },
};

/** Ferramenta interna, só com o site rodando no computador: grava em src/data/moldes. */
export default function MoldePage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main id="conteudo" tabIndex={-1} className="section-block">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4">
        <p className="eyebrow">Ferramenta interna</p>
        <h1 className="section-title">Molde da camiseta adulto a partir de foto</h1>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>
            Estenda a camiseta de frente, sem puxar, com as mangas abertas, sobre um fundo liso que
            contraste com o tecido (camiseta escura em lençol claro, ou o contrário).
          </li>
          <li>
            Fotografe bem de cima, com o celular paralelo ao chão, a peça inteira no quadro e folga
            nas bordas. Luz difusa, sem sombra forte.
          </li>
          <li>Meça a largura na costura da axila e o comprimento do ombro (junto à gola) até a barra.</li>
          <li>Escolha o tamanho, confira as medidas, envie a foto e gere o contorno.</li>
        </ol>
        <CadastroMolde tamanhos={TAMANHOS_CAMISETA_ADULTO} tabela={tabelaCamisetaAdulto()} />
      </div>
    </main>
  );
}
