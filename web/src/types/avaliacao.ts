export type StatusAvaliacao = "pendente" | "aprovada" | "ocultada";

export type AvaliacaoFoto = {
  id: string;
  storage_path: string;
  url: string;
};

export type AvaliacaoPublica = {
  id: string;
  modelo_id: string;
  nota: number;
  comentario: string;
  compra_verificada: boolean;
  criado_em: string;
  autor_nome: string;
  fotos: AvaliacaoFoto[];
};

export type ResumoAvaliacao = {
  modelo_id: string;
  media: number;
  total: number;
};
