export type FilhoForm = {
  nomeOuIniciais: string;
  escola: string;
  turma: string;
};

export type SolicitacaoPayload = {
  responsavelNome: string;
  whatsapp: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  consentimento: boolean;
  filhos: FilhoForm[];
  origem: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  honeypot: string;
};

export type SolicitacaoResult = {
  ok: true;
  totalEtiquetas: number;
  filhos: number;
};
