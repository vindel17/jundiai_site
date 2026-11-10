import type { Forma } from "@/lib/gabarito/forma";
import type { Ponto } from "@/lib/gabarito/glb";

const MARGEM_CM = 4;

/** Molde final em cm, como vai para o AR: contorno, linha da axila e eixo central. */
export function PreviaForma({ forma }: { forma: Forma }) {
  const esquerda = forma.metade
    .slice(1, -1)
    .reverse()
    .map(([x, z]): Ponto => [-x, z]);
  const pontos = [...forma.metade, ...esquerda];
  const meiaLargura = Math.max(...forma.metade.map(([x]) => x)) + MARGEM_CM;
  const meiaAxila = forma.largura / 2;

  return (
    <svg
      viewBox={`${-meiaLargura} ${-MARGEM_CM} ${2 * meiaLargura} ${forma.comprimento + 2 * MARGEM_CM}`}
      role="img"
      aria-label={`Molde com ${forma.largura} cm de axila a axila e ${forma.comprimento} cm de comprimento`}
      style={{ width: "100%", maxHeight: 420, background: "var(--bg-alt)", borderRadius: 12 }}
    >
      <polygon
        points={pontos.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="#dc2626"
        strokeWidth={0.5}
        strokeLinejoin="round"
      />
      <line x1={-meiaAxila} y1={forma.alturaCava} x2={meiaAxila} y2={forma.alturaCava} stroke="#dc2626" strokeWidth={0.25} />
      <line
        x1={0}
        y1={forma.profundidadeGola}
        x2={0}
        y2={forma.comprimento}
        stroke="#ca8a04"
        strokeWidth={0.25}
        strokeDasharray="2 2"
      />
    </svg>
  );
}
