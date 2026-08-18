type Props = {
  titulo: string;
  children: React.ReactNode;
  acoes: React.ReactNode;
};

/** Bloco usado nas telas de sistema (erro, 404): explica e oferece saída. */
export function TelaAviso({ titulo, children, acoes }: Props) {
  return (
    <main className="uj-aviso">
      <h1>{titulo}</h1>
      {children}
      <div className="uj-aviso-acoes">{acoes}</div>
    </main>
  );
}
