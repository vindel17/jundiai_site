export const SITE = {
  name: "Uniforme Jundiaí",
  brandLine: "Uma iniciativa da Espaço Livre Uniformes",
  city: "Jundiaí",
  state: "SP",
  domain: "uniformejundiai.com.br",
  etiquetasPorFilho: 5,
  maxFilhos: 3,
  prazoEstimado: "até 15 dias úteis após a confirmação",
} as const;

export function getWhatsAppUrl(message?: string) {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  if (!phone) return "#";
  const text = encodeURIComponent(
    message ??
      "Olá! Quero saber mais sobre os uniformes escolares do Uniforme Jundiaí.",
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export function getWhatsAppDisplay() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  if (phone.length < 12) return "";
  const ddd = phone.slice(2, 4);
  const part1 = phone.slice(4, 9);
  const part2 = phone.slice(9);
  return `(${ddd}) ${part1}-${part2}`;
}
