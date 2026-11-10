import type { Metadata } from "next";
import { GabaritoAr } from "@/components/gabarito/gabarito-ar";
import { SeletorCamiseta } from "@/components/gabarito/seletor-camiseta";
import { urlGabarito, urlsCamiseta, urlsCamisetaAdulto } from "@/lib/gabarito/arquivos";
import { TABELA_CAMISETA, TAMANHOS_CAMISETA } from "@/lib/gabarito/camiseta";
import { TAMANHOS_CAMISETA_ADULTO, tabelaCamisetaAdulto } from "@/lib/gabarito/camiseta-adulto";

export const metadata: Metadata = {
  title: "Teste de escala do gabarito",
  robots: { index: false, follow: false },
};

/** Página interna (sem link no site) para validar a escala do AR com fita métrica. */
export default function GabaritoTestePage() {
  return (
    <main id="conteudo" tabIndex={-1} className="section-block">
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4">
        <p className="eyebrow">Teste interno</p>
        <h1 className="section-title">Escala do gabarito em AR</h1>

        <GabaritoAr src={urlGabarito("teste-60cm.glb")} alt="Quadrado de teste de 60 cm com grade de 10 cm" />

        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>Estique uma fita métrica no chão, bem reta.</li>
          <li>Toque em “Abrir no chão em tamanho real” e mova o celular devagar até o quadrado aparecer.</li>
          <li>Arraste o quadrado para a borda vermelha ficar ao lado da fita.</li>
          <li>Meça do centro de uma linha vermelha ao centro da outra. O certo é 60 cm. Cada quadrinho azul tem 10 cm.</li>
          <li>Anote a medida vista em 3 situações: celular a ~50 cm do chão, em pé, e olhando de lado.</li>
        </ol>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Critério para seguir: erro de até 1 cm nos 60 cm. O canto amarelo só marca a orientação.
        </p>

        <h2 className="section-title mt-6">Camiseta (molde ilustrativo)</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>
            Estenda a camiseta de frente, sem puxar o tecido, num chão firme com algum desenho ou
            textura e boa luz. Piso liso e branco, cama ou sofá atrapalham.
          </li>
          <li>
            Escolha o tamanho e abra o contorno. Antes de posicionar, mova o celular devagar de um lado
            para o outro por uns 10 segundos.
          </li>
          <li>
            Arraste e gire até os dois quadradinhos amarelos ficarem logo acima do ombro, junto à gola, e
            a linha amarela tracejada passar pelo meio da peça.
          </li>
          <li>
            Olhe de cima, a uns 40 a 80 cm do chão. Se o contorno “pular”, reposicione.
          </li>
          <li>
            Os três tamanhos aparecem um dentro do outro. O contorno vermelho contínuo é o tamanho
            escolhido. O magenta (rosa forte) tracejado, por dentro, é o tamanho menor. O verde
            tracejado, por fora, é o maior. Veja de qual contorno a borda da peça fica mais perto.
          </li>
        </ol>
        <SeletorCamiseta
          urls={urlsCamiseta()}
          tamanhos={TAMANHOS_CAMISETA}
          tabela={TABELA_CAMISETA}
          inicial="06"
        />

        <h2 className="section-title mt-6">Camiseta adulto</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Mesmos passos da camiseta acima. A tabela vai de P a G2.
        </p>
        <SeletorCamiseta
          urls={urlsCamisetaAdulto()}
          tamanhos={TAMANHOS_CAMISETA_ADULTO}
          tabela={tabelaCamisetaAdulto()}
          inicial="M"
          nome="camiseta adulto"
        />
      </div>
    </main>
  );
}
