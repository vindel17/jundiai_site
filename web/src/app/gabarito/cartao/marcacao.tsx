"use client";

import { useMemo, useRef, type PointerEvent } from "react";
import type { Quadrilatero } from "@/lib/gabarito/cartao/homografia";
import type { Ponto } from "@/lib/gabarito/glb";

/** Um ponto de medida que dá para arrastar. */
export type AlcaDeMedida = { id: string; nome: string; ponto: Ponto };

const COR_PECA = "#facc15";
const COR_CARTAO = "#22c55e";

type Props = {
  /** Tamanho da foto medida, em pixels: as marcas usam essas coordenadas */
  largura: number;
  altura: number;
  contorno: Ponto[] | null;
  alcas: AlcaDeMedida[];
  /** Linhas tracejadas que mostram o que foi medido */
  linhas: [Ponto, Ponto][];
  cartao: Quadrilatero;
  aoMoverPonto: (id: string, ponto: Ponto) => void;
  aoMoverCanto: (indice: number, ponto: Ponto) => void;
  aoSoltarCanto: () => void;
};

const texto = (pontos: Ponto[]) => pontos.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** As marcas por cima da foto: contorno, linhas medidas e os pontos que dá para arrastar. */
export function Marcacao(props: Props) {
  const { largura, altura, contorno, alcas, linhas, cartao } = props;
  const beirada = useMemo(() => contorno && texto(contorno), [contorno]);
  const raio = Math.max(largura, altura) / 70;
  const traco = raio / 4;
  // Os cantos do cartão ficam perto uns dos outros: a área de toque não pode invadir a do vizinho.
  const ladoMenor = Math.min(
    Math.hypot(cartao[1][0] - cartao[0][0], cartao[1][1] - cartao[0][1]),
    Math.hypot(cartao[2][0] - cartao[1][0], cartao[2][1] - cartao[1][1]),
  );
  const limites = { largura, altura };

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      role="group"
      aria-label="Marcas da medição sobre a foto"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {beirada && <polygon points={beirada} fill="none" stroke="#e11d48" strokeWidth={traco} />}
      <g stroke={COR_PECA} strokeWidth={traco} strokeDasharray={`${raio} ${raio / 2}`}>
        {linhas.map((linha, i) => (
          <polyline key={i} points={texto(linha)} />
        ))}
      </g>
      <polygon points={texto(cartao)} fill="none" stroke={COR_CARTAO} strokeWidth={traco} />

      {alcas.map(({ id, nome, ponto }) => (
        <Alca
          key={id}
          nome={nome}
          ponto={ponto}
          cor={COR_PECA}
          raio={raio}
          toque={raio * 2.5}
          limites={limites}
          aoMover={(p) => props.aoMoverPonto(id, p)}
        />
      ))}
      {cartao.map((canto, i) => (
        <Alca
          key={i}
          nome={`Canto ${i + 1} do cartão`}
          ponto={canto}
          cor={COR_CARTAO}
          raio={raio * 0.6}
          toque={Math.max(raio * 0.6, Math.min(raio * 2.5, ladoMenor * 0.45))}
          limites={limites}
          aoMover={(p) => props.aoMoverCanto(i, p)}
          aoSoltar={props.aoSoltarCanto}
        />
      ))}
    </svg>
  );
}

type PropsAlca = {
  nome: string;
  ponto: Ponto;
  cor: string;
  raio: number;
  /** Raio da área que responde ao dedo, maior que o desenho */
  toque: number;
  limites: { largura: number; altura: number };
  aoMover: (ponto: Ponto) => void;
  aoSoltar?: () => void;
};

/** Um ponto que dá para arrastar com o dedo ou o mouse. */
function Alca({ nome, ponto, cor, raio, toque, limites, aoMover, aoSoltar }: PropsAlca) {
  /** Distância entre o dedo e o ponto ao começar: o ponto não pula para baixo do dedo. */
  const folga = useRef<Ponto | null>(null);

  function naFoto(evento: PointerEvent<SVGCircleElement>): Ponto {
    const quadro = evento.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const escala = limites.largura / quadro.width;
    return [(evento.clientX - quadro.left) * escala, (evento.clientY - quadro.top) * escala];
  }

  function pegar(evento: PointerEvent<SVGCircleElement>) {
    evento.currentTarget.setPointerCapture(evento.pointerId);
    const dedo = naFoto(evento);
    folga.current = [ponto[0] - dedo[0], ponto[1] - dedo[1]];
  }

  function arrastar(evento: PointerEvent<SVGCircleElement>) {
    if (!folga.current) return;
    const dedo = naFoto(evento);
    aoMover([
      Math.min(Math.max(dedo[0] + folga.current[0], 0), limites.largura - 1),
      Math.min(Math.max(dedo[1] + folga.current[1], 0), limites.altura - 1),
    ]);
  }

  function soltar() {
    if (!folga.current) return;
    folga.current = null;
    aoSoltar?.();
  }

  return (
    <g>
      <circle cx={ponto[0]} cy={ponto[1]} r={raio} fill="none" stroke="#111827" strokeWidth={raio / 2} />
      <circle cx={ponto[0]} cy={ponto[1]} r={raio} fill="none" stroke={cor} strokeWidth={raio / 4} />
      <circle cx={ponto[0]} cy={ponto[1]} r={raio / 6} fill={cor} />
      <circle
        cx={ponto[0]}
        cy={ponto[1]}
        r={toque}
        fill="transparent"
        aria-label={nome}
        style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={pegar}
        onPointerMove={arrastar}
        onPointerUp={soltar}
        onPointerCancel={soltar}
      >
        <title>{nome}</title>
      </circle>
    </g>
  );
}
