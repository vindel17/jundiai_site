import { fraseContador } from "@/lib/reserva/contador";

export function ContadorKits({ total }: { total: number }) {
  const frase = fraseContador(total);
  if (!frase) return null;

  return (
    <p className="contador-kits">
      <strong>{frase.numero}</strong> {frase.resto}
    </p>
  );
}
