import { encaixarCartao, medirPeca } from "@/lib/gabarito/cartao/medir";
import { RECEITAS } from "@/lib/gabarito/cartao/receitas";
import type { Imagem } from "@/lib/gabarito/molde/mascara";
import type { Pedido } from "./medidor";

/**
 * Faz as contas da foto fora da tela, para a página não travar. A foto
 * fica guardada aqui enquanto a pessoa corrige os pontos à mão.
 */
let foto: Imagem | null = null;

addEventListener("message", ({ data }: MessageEvent<Pedido>) => {
  if (data.tipo === "medir") {
    foto = data.imagem;
    postMessage(medirPeca(foto, RECEITAS[data.parte]));
  } else {
    postMessage(foto && encaixarCartao(foto, data.cantos));
  }
});
