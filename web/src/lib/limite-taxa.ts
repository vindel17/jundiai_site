/**
 * Limite de requisições por chave (em geral, o IP), em janela fixa.
 *
 * Vive na memória do processo: serve para conter inundação, não para contar
 * com exatidão. Reiniciar o serviço zera as janelas, e com várias instâncias
 * cada uma conta por conta própria. Para o que precisa de contagem exata,
 * use o banco.
 */

export type Limitador = {
  /** Registra uma tentativa. Devolve false quando a chave passou do limite. */
  permitir(chave: string, agora?: number): boolean;
};

type Opcoes = {
  /** Tentativas aceitas por chave em cada janela. */
  max: number;
  janelaMs: number;
  /** Teto de chaves guardadas, para a memória não crescer sem limite. */
  maxChaves?: number;
};

type Janela = { inicio: number; contagem: number };

export function criarLimitador({ max, janelaMs, maxChaves = 5000 }: Opcoes): Limitador {
  const janelas = new Map<string, Janela>();

  function limparVencidas(agora: number) {
    for (const [chave, janela] of janelas) {
      if (agora - janela.inicio >= janelaMs) janelas.delete(chave);
    }
  }

  function abrirEspaco(agora: number) {
    if (janelas.size < maxChaves) return;
    limparVencidas(agora);
    // Ainda cheio de janelas vivas: descarta a mais antiga (primeira inserida).
    if (janelas.size >= maxChaves) {
      const maisAntiga = janelas.keys().next().value;
      if (maisAntiga !== undefined) janelas.delete(maisAntiga);
    }
  }

  return {
    permitir(chave, agora = Date.now()) {
      const atual = janelas.get(chave);
      if (!atual || agora - atual.inicio >= janelaMs) {
        janelas.delete(chave);
        abrirEspaco(agora);
        janelas.set(chave, { inicio: agora, contagem: 1 });
        return true;
      }
      atual.contagem += 1;
      return atual.contagem <= max;
    },
  };
}
