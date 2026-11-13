import type { Quadrilatero } from "@/lib/gabarito/cartao/homografia";
import type { FalhaNaMedicao, Medicao } from "@/lib/gabarito/cartao/medir";
import type { Parte } from "@/lib/gabarito/cartao/receitas";
import type { Imagem } from "@/lib/gabarito/molde/mascara";

export type Pedido =
  | { tipo: "medir"; parte: Parte; imagem: Imagem }
  | { tipo: "encaixar"; cantos: Quadrilatero };

export type Medidor = ReturnType<typeof criarMedidor>;

/**
 * Liga o processamento da foto, que roda no próprio aparelho, fora da
 * tela. Atende um pedido por vez, na ordem em que chegam.
 */
export function criarMedidor() {
  const trabalhador = new Worker(new URL("./medidor.worker.ts", import.meta.url), { type: "module" });
  let fila: Promise<unknown> = Promise.resolve();
  const pedir = <Resposta>(pedido: Pedido, entregar: Transferable[] = []) => {
    const resposta = fila.then(
      () =>
        new Promise<Resposta>((resolver, rejeitar) => {
          trabalhador.onmessage = (evento) => resolver(evento.data);
          trabalhador.onerror = (evento) => rejeitar(new Error(evento.message));
          trabalhador.postMessage(pedido, entregar);
        }),
    );
    fila = resposta.catch(() => undefined);
    return resposta;
  };

  return {
    /** A foto é entregue ao processamento sem cópia; não pode ser usada depois aqui. */
    medir: (parte: Parte, imagem: Imagem) =>
      pedir<Medicao | FalhaNaMedicao>({ tipo: "medir", parte, imagem }, [imagem.dados.buffer]),
    /** Leva cantos marcados à mão para as bordas do cartão na última foto medida. */
    encaixar: (cantos: Quadrilatero) => pedir<Quadrilatero | null>({ tipo: "encaixar", cantos }),
    encerrar: () => trabalhador.terminate(),
  };
}
