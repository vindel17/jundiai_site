type Props = {
  nota: number;
  tamanho?: "sm" | "md" | "lg";
  interativo?: boolean;
  onChange?: (nota: number) => void;
  nome?: string;
};

const TAMANHOS = {
  sm: "1rem",
  md: "1.35rem",
  lg: "1.75rem",
} as const;

export function Estrelas({
  nota,
  tamanho = "md",
  interativo = false,
  onChange,
  nome = "nota",
}: Props) {
  const size = TAMANHOS[tamanho];

  if (!interativo) {
    return (
      <span
        className="ps-estrelas"
        style={{ fontSize: size }}
        aria-label={`${nota} de 5 estrelas`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= nota ? "ligada" : undefined} aria-hidden>
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <fieldset className="ps-estrelas-campo">
      <legend className="sr-only">Nota de 1 a 5 estrelas</legend>
      <div
        className="ps-estrelas ps-estrelas--interativo"
        style={{ fontSize: size }}
        role="radiogroup"
        aria-label="Sua nota"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= nota ? "ligada" : undefined}>
            <input
              type="radio"
              name={nome}
              value={n}
              checked={nota === n}
              onChange={() => onChange?.(n)}
              required
            />
            <span aria-hidden>★</span>
            <span className="sr-only">{n} estrela{n > 1 ? "s" : ""}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
