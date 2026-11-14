const HISTORICO = "iaHistorico";
const MAXIMO = 8;

export type TurnoIa = { papel: "usuario" | "loja"; texto: string };
type MensagemModelo = { role: "user" | "assistant"; content: string };

export function historicoDe(dados: Record<string, unknown>): TurnoIa[] {
  const valor = dados[HISTORICO];
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const turno = item as Partial<TurnoIa>;
    if ((turno.papel !== "usuario" && turno.papel !== "loja") || typeof turno.texto !== "string") {
      return [];
    }
    const texto = turno.texto.trim();
    return texto ? [{ papel: turno.papel, texto: texto.slice(0, 500) }] : [];
  }).slice(-MAXIMO);
}

export function comHistorico(dados: Record<string, unknown>, turnos: TurnoIa[]) {
  return { ...dados, [HISTORICO]: turnos.slice(-MAXIMO) };
}

export function paraModelo(turnos: TurnoIa[], pergunta: string): MensagemModelo[] {
  const lista: MensagemModelo[] = turnos.map((turno) => ({
    role: turno.papel === "loja" ? "assistant" : "user",
    content: turno.texto,
  }));
  const ultima = lista[lista.length - 1];
  if (ultima?.role === "user") ultima.content = `${ultima.content}\n${pergunta}`;
  else lista.push({ role: "user", content: pergunta });
  return lista;
}
