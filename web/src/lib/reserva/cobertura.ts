import { ESCOLAS_VOUCHER } from "@/data/escolas";

/** Quanto de cada escola do voucher já reservou com a gente. */
export type LinhaCobertura = {
  escola: string;
  bairro: string;
  alunos: number;
  reservas: number;
  /** Reservas ÷ alunos, em %. Sem teto: se passar de 100, a matrícula do PDF está defasada. */
  percentual: number;
};

export type Cobertura = {
  escolas: LinhaCobertura[];
  totalAlunos: number;
  totalReservas: number;
  percentualGeral: number;
  escolasSemReserva: number;
  /** Reservas de escola que não está na lista do voucher (cadastro antigo). */
  foraDaLista: number;
};

export const ORDENS_COBERTURA = ["percentual", "reservas", "alunos", "nome"] as const;

export type OrdemCobertura = (typeof ORDENS_COBERTURA)[number];

export function lerOrdemCobertura(valor: string | undefined): OrdemCobertura {
  return (ORDENS_COBERTURA as readonly string[]).includes(valor ?? "")
    ? (valor as OrdemCobertura)
    : "percentual";
}

const COMPARAR: Record<OrdemCobertura, (a: LinhaCobertura, b: LinhaCobertura) => number> = {
  percentual: (a, b) => b.percentual - a.percentual,
  reservas: (a, b) => b.reservas - a.reservas,
  alunos: (a, b) => b.alunos - a.alunos,
  nome: (a, b) => a.escola.localeCompare(b.escola, "pt-BR"),
};

function percentual(parte: number, todo: number) {
  return todo > 0 ? (parte / todo) * 100 : 0;
}

/** `reservasPorEscola` guarda só reservas ativas, indexadas pelo nome gravado na reserva. */
export function calcularCobertura(
  reservasPorEscola: Readonly<Record<string, number>>,
  ordem: OrdemCobertura = "percentual",
): Cobertura {
  const escolas = ESCOLAS_VOUCHER.map((escola) => {
    const reservas = reservasPorEscola[escola.nome] ?? 0;
    return {
      escola: escola.nome,
      bairro: escola.bairro,
      alunos: escola.alunos,
      reservas,
      percentual: percentual(reservas, escola.alunos),
    };
  }).sort((a, b) => COMPARAR[ordem](a, b) || a.escola.localeCompare(b.escola, "pt-BR"));

  const totalAlunos = escolas.reduce((soma, linha) => soma + linha.alunos, 0);
  const totalReservas = escolas.reduce((soma, linha) => soma + linha.reservas, 0);
  const conhecidas = new Set(ESCOLAS_VOUCHER.map((escola) => escola.nome));
  const foraDaLista = Object.entries(reservasPorEscola)
    .filter(([nome]) => !conhecidas.has(nome))
    .reduce((soma, [, quantidade]) => soma + quantidade, 0);

  return {
    escolas,
    totalAlunos,
    totalReservas,
    percentualGeral: percentual(totalReservas, totalAlunos),
    escolasSemReserva: escolas.filter((linha) => linha.reservas === 0).length,
    foraDaLista,
  };
}

export function formatarPercentual(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}
