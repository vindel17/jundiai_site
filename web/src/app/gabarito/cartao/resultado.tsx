import type { Quadrilatero } from "@/lib/gabarito/cartao/homografia";
import { avisosDaFoto } from "@/lib/gabarito/cartao/medir";
import type { Medidas } from "@/lib/gabarito/cartao/receita";
import type { Parte } from "@/lib/gabarito/cartao/receitas";
import { gradeDaPeca, rotuloMedida } from "@/lib/reserva/medidas";
import { PARTES, pecasDaParte, sugestaoDaParte } from "./partes";
import type { Leitura } from "./use-medicao";

type Props = { parte: Parte; medidas: Medidas; cartao: Quadrilatero; leitura: Leitura };

const numero = (valor: number, casas = 1) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const minusculo = (texto: string) => texto.toLocaleLowerCase("pt-BR");
const comSinal = (cm: number) => `${cm < 0 ? "−" : "+"}${numero(Math.abs(cm))} cm`;
const lista = (itens: string[]) => new Intl.ListFormat("pt-BR").format(itens);

function Sugestao({ parte, medidas }: Pick<Props, "parte" | "medidas">) {
  const { grade: pecaDaGrade } = PARTES[parte];
  const grade = gradeDaPeca(pecaDaGrade);
  const sugestao = sugestaoDaParte(parte, medidas);
  if (!grade || !sugestao) return null;
  const { tamanho, folga } = sugestao;
  if (!tamanho || !folga) {
    return <p>Esta peça é maior que o maior tamanho da grade (G).</p>;
  }
  return (
    <div>
      <p className="text-lg">
        Tamanho sugerido: <b>{tamanho}</b>
      </p>
      <p className="text-sm">Vale para: {minusculo(lista(pecasDaParte(parte)))}.</p>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Tamanho {tamanho} na grade: {minusculo(rotuloMedida(pecaDaGrade, tamanho))}. Diferença para a peça
        medida: {grade.medidas.map((nome, i) => `${minusculo(nome)} ${comSinal(folga[i])}`).join("; ")}.
      </p>
    </div>
  );
}

/** Medidas, tamanho sugerido e os números brutos da leitura, para conferir com a fita métrica. */
export function Resultado({ parte, medidas, cartao, leitura }: Props) {
  const config = PARTES[parte];
  const nomes = gradeDaPeca(config.grade)?.medidas ?? config.medidas;
  const lados = [0, 1].map((i) => Math.hypot(cartao[i + 1][0] - cartao[i][0], cartao[i + 1][1] - cartao[i][1]));
  const avisos = avisosDaFoto(medidas, cartao, config.receita);
  const brutos = [
    ...medidas.valores.map((valor, i) => `${minusculo(nomes[i])}: ${numero(valor, 2)} cm`),
    `cartão a ${numero(medidas.cartaoDoCentro)} cm do meio da parte medida`,
    `cartão na foto: ${numero(Math.max(...lados))} × ${numero(Math.min(...lados))} px`,
    `desfoque da borda: ${leitura.desfoque === null ? "não medido" : `${numero(leitura.desfoque)} px`}`,
    `foto: ${leitura.original.join(" × ")} px, medida em ${leitura.medida.join(" × ")} px`,
    `processamento: ${Math.round(leitura.tempo)} ms`,
    `pontos da peça: ${leitura.pontosCorrigidos ? "corrigidos à mão" : "achados sozinhos"}`,
    `cartão: ${leitura.cartaoSolto ? "marcado à mão, sem encaixe" : "encaixado nas bordas"}`,
  ];

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3">
        {config.medidas.map((nome, i) => (
          <div key={nome}>
            <dt className="text-sm">{nome}</dt>
            <dd className="text-2xl font-bold">{numero(medidas.valores[i])} cm</dd>
          </div>
        ))}
      </dl>
      <Sugestao parte={parte} medidas={medidas} />
      {leitura.cartaoSolto && (
        <p className="form-error">
          Os cantos do cartão foram marcados à mão e não se encaixaram nas bordas, então a medida é
          aproximada.
        </p>
      )}
      {avisos.map((aviso) => (
        <p key={aviso} className="form-error">
          {aviso}
        </p>
      ))}
      <details open>
        <summary>Números brutos</summary>
        <ul className="text-sm" style={{ color: "var(--muted)" }}>
          {brutos.map((linha) => (
            <li key={linha}>{linha}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
