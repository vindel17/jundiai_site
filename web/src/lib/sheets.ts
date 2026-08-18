import { google } from "googleapis";
import type { SolicitacaoInput } from "@/lib/validation";
import { totalEtiquetas } from "@/lib/validation";

const HEADERS = [
  "data",
  "status",
  "origem",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "responsavel",
  "whatsapp",
  "email",
  "cep",
  "rua",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "uf",
  "qtd_filhos",
  "total_etiquetas",
  "filho1_nome",
  "filho1_escola",
  "filho1_turma",
  "filho2_nome",
  "filho2_escola",
  "filho2_turma",
  "filho3_nome",
  "filho3_escola",
  "filho3_turma",
  "consentimento",
] as const;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !sheetId) {
    return null;
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { auth, sheetId };
}

function toRow(data: SolicitacaoInput): string[] {
  const filhos = [0, 1, 2].map((i) => data.filhos[i]);
  return [
    new Date().toISOString(),
    "solicitado",
    data.origem ?? "",
    data.utmSource ?? "",
    data.utmMedium ?? "",
    data.utmCampaign ?? "",
    data.responsavelNome,
    data.whatsapp,
    data.email ?? "",
    data.cep,
    data.rua,
    data.numero,
    data.complemento ?? "",
    data.bairro,
    data.cidade,
    data.uf,
    String(data.filhos.length),
    String(totalEtiquetas(data.filhos.length)),
    filhos[0]?.nomeOuIniciais ?? "",
    filhos[0]?.escola ?? "",
    filhos[0]?.turma ?? "",
    filhos[1]?.nomeOuIniciais ?? "",
    filhos[1]?.escola ?? "",
    filhos[1]?.turma ?? "",
    filhos[2]?.nomeOuIniciais ?? "",
    filhos[2]?.escola ?? "",
    filhos[2]?.turma ?? "",
    data.consentimento ? "sim" : "nao",
  ];
}

async function ensureHeader(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
) {
  const range = "Solicitacoes!A1:AB1";
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const firstRow = existing.data.values?.[0];
  if (firstRow?.length) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [Array.from(HEADERS)] },
  });
}

/** Em desenvolvimento, grava em memória/console se Sheets não estiver configurado. */
const fallbackStore: string[][] = [];

export function getFallbackStore() {
  return fallbackStore;
}

export async function appendSolicitacao(data: SolicitacaoInput) {
  const row = toRow(data);
  const config = getAuth();

  if (!config) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Google Sheets não configurado. Defina GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY e GOOGLE_SHEETS_ID.",
      );
    }
    fallbackStore.push(row);
    console.info("[CRM fallback] solicitação registrada localmente", {
      responsavel: data.responsavelNome,
      filhos: data.filhos.length,
    });
    return { mode: "fallback" as const };
  }

  const sheets = google.sheets({ version: "v4", auth: config.auth });
  await ensureHeader(sheets, config.sheetId);
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.sheetId,
    range: "Solicitacoes!A:AB",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return { mode: "sheets" as const };
}
