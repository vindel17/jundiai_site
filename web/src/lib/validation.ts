import { z } from "zod";
import { ESCOLAS_JUNDIAI } from "@/data/escolas";
import { SITE } from "@/lib/constants";

const escolaEnum = z.enum(ESCOLAS_JUNDIAI as unknown as [string, ...string[]]);

const filhoSchema = z.object({
  nomeOuIniciais: z
    .string()
    .trim()
    .min(2, "Informe o nome ou as iniciais")
    .max(40, "Máximo de 40 caracteres"),
  escola: escolaEnum,
  turma: z.string().trim().max(30).optional().default(""),
});

export const solicitacaoSchema = z
  .object({
    responsavelNome: z
      .string()
      .trim()
      .min(3, "Informe o nome completo")
      .max(120),
    whatsapp: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp inválido"),
    email: z
      .string()
      .trim()
      .email("E-mail inválido")
      .optional()
      .or(z.literal("")),
    cep: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 8, "CEP inválido"),
    rua: z.string().trim().min(2, "Informe a rua").max(160),
    numero: z.string().trim().min(1, "Informe o número").max(20),
    complemento: z.string().trim().max(80).optional().default(""),
    bairro: z.string().trim().min(2, "Informe o bairro").max(80),
    cidade: z.literal("Jundiaí"),
    uf: z.literal("SP"),
    consentimento: z.literal(true, {
      error: "É necessário aceitar a política de privacidade",
    }),
    filhos: z
      .array(filhoSchema)
      .min(1, "Inclua pelo menos 1 filho")
      .max(SITE.maxFilhos, `Máximo de ${SITE.maxFilhos} filhos`),
    origem: z.string().trim().max(80).optional().default(""),
    utmSource: z.string().trim().max(80).optional().default(""),
    utmMedium: z.string().trim().max(80).optional().default(""),
    utmCampaign: z.string().trim().max(80).optional().default(""),
    honeypot: z.string().max(0).optional().default(""),
  })
  .strict();

export type SolicitacaoInput = z.infer<typeof solicitacaoSchema>;

export function totalEtiquetas(filhosCount: number) {
  return filhosCount * SITE.etiquetasPorFilho;
}
