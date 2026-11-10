import type { Ponto } from "@/lib/gabarito/glb";
import type { Imagem } from "@/lib/gabarito/molde/mascara";

/** Foto reduzida: sobra precisão (cerca de 1 mm por pixel) e o processamento fica rápido. */
const LADO_MAXIMO = 1000;

/** Desenha a foto no canvas e devolve os pixels para o processamento. */
export function desenharFoto(canvas: HTMLCanvasElement, foto: ImageBitmap): Imagem {
  const escala = Math.min(1, LADO_MAXIMO / Math.max(foto.width, foto.height));
  canvas.width = Math.round(foto.width * escala);
  canvas.height = Math.round(foto.height * escala);
  const contexto = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexto) throw new Error("Canvas indisponível");
  contexto.drawImage(foto, 0, 0, canvas.width, canvas.height);
  const { data } = contexto.getImageData(0, 0, canvas.width, canvas.height);
  return { largura: canvas.width, altura: canvas.height, dados: data };
}

/** Contorno encontrado em vermelho e os pontos de medida em amarelo, por cima da foto. */
export function marcarFoto(canvas: HTMLCanvasElement, contorno: Ponto[], marcas: Ponto[]) {
  const contexto = canvas.getContext("2d");
  if (!contexto) return;
  const espessura = Math.max(2, canvas.width / 300);
  contexto.lineWidth = espessura;
  contexto.strokeStyle = "#e11d48";
  contexto.beginPath();
  contorno.forEach(([x, y], i) => (i ? contexto.lineTo(x + 0.5, y + 0.5) : contexto.moveTo(x + 0.5, y + 0.5)));
  contexto.closePath();
  contexto.stroke();

  contexto.fillStyle = "#facc15";
  contexto.strokeStyle = "#111827";
  for (const [x, y] of marcas) {
    contexto.beginPath();
    contexto.arc(x + 0.5, y + 0.5, espessura * 3, 0, Math.PI * 2);
    contexto.fill();
    contexto.stroke();
  }
}
