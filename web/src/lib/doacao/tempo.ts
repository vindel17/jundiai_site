/** Relógio em linguagem de anúncio, sem data crua. */
export function haQuanto(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "agora";
  const horas = Math.floor(ms / 3_600_000);
  if (horas < 1) return "agora";
  if (horas < 24) return "hoje";
  if (horas < 48) return "ontem";
  return `há ${Math.floor(horas / 24)} dias`;
}
