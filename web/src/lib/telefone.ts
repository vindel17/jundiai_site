/** Normaliza um celular brasileiro para E.164 (+55DDD9XXXXXXXX). */
export function paraE164(entrada: string): string | null {
  const digitos = entrada.replace(/\D/g, "");
  const semDdi = digitos.startsWith("55") ? digitos.slice(2) : digitos;

  // DDD (2) + celular (9)
  if (semDdi.length !== 11) return null;
  if (semDdi[2] !== "9") return null;

  return `+55${semDdi}`;
}

/** (11) 99999-9999 — para exibir de volta ao usuário. */
export function formatarCelular(entrada: string): string {
  const d = entrada.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
