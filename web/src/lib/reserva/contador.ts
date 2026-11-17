const LIMITE = 10000;

/** O site nunca mostra zero nem um total negativo. */
export function totalPublico(sistema: number, fora: number) {
  const soma = sistema + fora;
  if (!Number.isFinite(soma)) return 0;
  return Math.max(0, Math.trunc(soma));
}

/** A partir de 1. Abaixo disso a frase some. */
export function fraseContador(total: number): { numero: string; resto: string } | null {
  if (!Number.isInteger(total) || total < 1) return null;
  return {
    numero: total.toLocaleString("pt-BR"),
    resto: total === 1 ? "aluno já reservou o kit" : "alunos já reservaram o kit",
  };
}

/** O campo do admin soma este inteiro. Zero e texto solto não entram. */
export function quantidadeDoCampo(valor: string) {
  const texto = valor.trim();
  if (!/^[+-]?\d+$/.test(texto)) return null;
  const quantidade = Number(texto);
  if (quantidade === 0 || quantidade < -LIMITE || quantidade > LIMITE) return null;
  return quantidade;
}
