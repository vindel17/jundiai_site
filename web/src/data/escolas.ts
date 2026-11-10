/**
 * Escolas do voucher em Jundiaí.
 * Fonte: “Escolas e Alunos por Região”, 3ª reunião das confecções homologadas.
 * Páginas repetidas do PDF foram descartadas. Nomes já usados no site foram mantidos.
 */

export type SegmentoEscola =
  | "Creche / Pré-escola"
  | "Pré-escola"
  | "Pré-escola / Fundamental I"
  | "Fundamental I"
  | "Outros";

export type EscolaVoucher = {
  nome: string;
  bairro: string;
  segmento: SegmentoEscola;
  alunos: number;
};

export const ESCOLAS_VOUCHER: readonly EscolaVoucher[] = [
  { nome: "Amélia Lima Lopes EMEB", bairro: "Vila Esperança", segmento: "Creche / Pré-escola", alunos: 164 },
  { nome: "Anezio de Oliveira Professor EMEB dos Sonhos", bairro: "Vila Marlene", segmento: "Pré-escola / Fundamental I", alunos: 578 },
  { nome: "Anna Pontes Chagas Profa EMEB", bairro: "Jardim América", segmento: "Creche / Pré-escola", alunos: 251 },
  { nome: "Anna Rita Alves Ludke Profa EMEB", bairro: "Vila Alvorada", segmento: "Fundamental I", alunos: 595 },
  { nome: "Antonino Messina EMEB", bairro: "Jardim Bonfiglioli", segmento: "Fundamental I", alunos: 300 },
  { nome: "Antonio Adelino Marques da Silva Brandão Prof. EMEB", bairro: "Morada das Vinhas", segmento: "Fundamental I", alunos: 616 },
  { nome: "Antonio de Pádua Giaretta EMEB", bairro: "Jardim Carlos Gomes", segmento: "Pré-escola / Fundamental I", alunos: 262 },
  { nome: "Antonio Loureiro EMEB", bairro: "Vila Helena", segmento: "Fundamental I", alunos: 252 },
  { nome: "Aparecida Bernardi do Amaral Profa EMEB", bairro: "Moradas das Vinhas", segmento: "Creche / Pré-escola", alunos: 207 },
  { nome: "Aparecida Merino Elias EMEB", bairro: "Medeiros", segmento: "Outros", alunos: 892 },
  { nome: "Aparecido Garcia EMEB", bairro: "Jardim Martins", segmento: "Fundamental I", alunos: 416 },
  { nome: "Armanda Santina Polenti Profa EMEB", bairro: "Parque São Luiz", segmento: "Fundamental I", alunos: 433 },
  { nome: "Beatriz Blattner Pupo Profa EMEB", bairro: "Novo Horizonte", segmento: "Fundamental I", alunos: 549 },
  { nome: "Benedita Alzira de Moraes Camunhas Professora EMEB", bairro: "Fazenda Grande", segmento: "Pré-escola", alunos: 247 },
  { nome: "Carlos Foot Guimarães Prof. EMEB", bairro: "Jardim Santa Gertrudes", segmento: "Fundamental I", alunos: 458 },
  { nome: "Celsina Barbosa Pazinatto Profa EMEB", bairro: "Vila Nova Jundiaí", segmento: "Pré-escola", alunos: 114 },
  { nome: "Cesarina Fortarel Gonçalves Dias Profa EMEB", bairro: "Vila Jundiainópolis", segmento: "Fundamental I", alunos: 297 },
  { nome: "Cleo Nogueira Barbosa Profa EMEB", bairro: "Jardim Novo Horizonte", segmento: "Pré-escola", alunos: 558 },
  { nome: "Clotilde Copelli de Miranda Profa EMEB", bairro: "Jardim do Lago", segmento: "Creche / Pré-escola", alunos: 317 },
  { nome: "Clotilde Mazzali Bollini Profa EMEB", bairro: "Jardim Pacaembu", segmento: "Pré-escola", alunos: 155 },
  { nome: "Deodato Janski EMEB", bairro: "Jardim Tarumã", segmento: "Fundamental I", alunos: 594 },
  { nome: "Dina Rosete Zandona Cunninghan Profa EMEB", bairro: "Jardim do Lírio", segmento: "Creche / Pré-escola", alunos: 234 },
  { nome: "Duilio Maziero EMEB", bairro: "Bairro da Toca", segmento: "Pré-escola / Fundamental I", alunos: 254 },
  { nome: "Fabio Rodrigues Mendes Prof. EMEB", bairro: "Engordadouro", segmento: "Pré-escola / Fundamental I", alunos: 366 },
  { nome: "Fatima A. D. S. Pandolpho Profa EMEB", bairro: "Novo Horizonte", segmento: "Pré-escola / Fundamental I", alunos: 313 },
  { nome: "Flavio Dangieri Prof. EMEB", bairro: "Anhangabaú", segmento: "Fundamental I", alunos: 471 },
  { nome: "Florida Mestag Irma EMEB", bairro: "Mato Dentro", segmento: "Pré-escola / Fundamental I", alunos: 164 },
  { nome: "Florisa Volpe Profa EMEB", bairro: "Parque Brasília", segmento: "Pré-escola", alunos: 64 },
  { nome: "Geralda Berthola Facca Profa EMEB", bairro: "Jardim do Lago", segmento: "Fundamental I", alunos: 610 },
  { nome: "Geraldo Pinto Duarte Paes EMEB", bairro: "Jardim Ermida II", segmento: "Pré-escola / Fundamental I", alunos: 521 },
  { nome: "Gloria da Silva Rocha Genovese Profa EMEB", bairro: "Vila Cristo Redentor", segmento: "Fundamental I", alunos: 317 },
  { nome: "Helena Meirelles Maia Torres Profa EMEB", bairro: "Vila Helena", segmento: "Pré-escola", alunos: 147 },
  { nome: "Hermenegildo Martinelli Comendador EMEB", bairro: "Caxambu", segmento: "Fundamental I", alunos: 403 },
  { nome: "Iracy Ferreira Bueno EMEB", bairro: "Vila Genoveva", segmento: "Creche / Pré-escola", alunos: 195 },
  { nome: "Isabel Christina Marques de Oliveira Profa EMEB", bairro: "Jardim Guanabara", segmento: "Fundamental I", alunos: 322 },
  { nome: "Ivo de Bona EMEB", bairro: "Almerinda Chaves", segmento: "Fundamental I", alunos: 1156 },
  { nome: "Janet Ferreira Prado Profa EMEB", bairro: "Vila Nambi", segmento: "Pré-escola / Fundamental I", alunos: 792 },
  { nome: "Janio da Silva Quadros Prof. EMEB", bairro: "Eloy Chaves", segmento: "Creche / Pré-escola", alunos: 215 },
  { nome: "João Batista Toledo Vereador EMEB", bairro: "Jardim Tamoio", segmento: "Pré-escola", alunos: 259 },
  { nome: "João Luiz de Campos Prof. EMEB", bairro: "Jardim Florestal", segmento: "Fundamental I", alunos: 268 },
  { nome: "Joaquim Candelario de Freitas Prof. EMEB", bairro: "Cidade Luiza", segmento: "Pré-escola / Fundamental I", alunos: 1083 },
  { nome: "José Leme do Prado Filho Prof. EMEB", bairro: "Jardim Esplanada", segmento: "Pré-escola / Fundamental I", alunos: 369 },
  { nome: "José Pedro Raymundo Vereador EMEB", bairro: "Vila Rio Branco", segmento: "Creche / Pré-escola", alunos: 171 },
  { nome: "José Romeiro Pereira Dr. EMEB", bairro: "Vila Progresso", segmento: "Pré-escola / Fundamental I", alunos: 435 },
  { nome: "José Sciamarelli Sobrinho EMEB", bairro: "Champirra", segmento: "Pré-escola", alunos: 115 },
  { nome: "Judith Almeida Curado Arruda Profa EMEB", bairro: "Cidade Nova", segmento: "Fundamental I", alunos: 680 },
  { nome: "Lazaro Miranda Duarte Prof. EMEB", bairro: "Vila Nova Jundiainópolis", segmento: "Fundamental I", alunos: 225 },
  { nome: "Luiz Barbaro EMEB", bairro: "Ponte São João", segmento: "Outros", alunos: 285 },
  { nome: "Luiz Biela de Souza Prof. EMEB", bairro: "Jardim Santa Gertrudes", segmento: "Pré-escola / Fundamental I", alunos: 523 },
  { nome: "Luzia Francisca de Souza Martins EMEB", bairro: "Ivoturucaia", segmento: "Pré-escola / Fundamental I", alunos: 600 },
  { nome: "Manoel Anibal Marcondes Prefeito EMEB", bairro: "Conjunto Residencial IAPI", segmento: "Creche / Pré-escola", alunos: 130 },
  { nome: "Marcos Gasparian EMEB", bairro: "Centro", segmento: "Fundamental I", alunos: 332 },
  { nome: "Maria Angélica Lorençon Profa EMEB", bairro: "Corrupira", segmento: "Pré-escola / Fundamental I", alunos: 378 },
  { nome: "Maria Aparecida de Souza Almeida Ramos Profa EMEB", bairro: "Jardim Tarumã", segmento: "Creche / Pré-escola", alunos: 257 },
  { nome: "Maria Gemma Gennari Carturan Profa EMEB", bairro: "Vila Rossi", segmento: "Creche / Pré-escola", alunos: 277 },
  { nome: "Maria Lucia Massarente Klinke Profa EMEB", bairro: "Jardim Tulipas", segmento: "Creche / Pré-escola", alunos: 375 },
  { nome: "Marina de Almeida Rinaldi Carvalho Profa EMEB", bairro: "Jardim Tulipas", segmento: "Fundamental I", alunos: 802 },
  { nome: "Marly de M. M. Pereira Profa EMEB", bairro: "Fazenda Grande", segmento: "Fundamental I", alunos: 241 },
  { nome: "Melania Fortarel Barbosa Profa EMEB", bairro: "Bairro do Poste", segmento: "Pré-escola / Fundamental I", alunos: 381 },
  { nome: "Mercedes Basile Bonito Profa EMEB", bairro: "Santa Gertrudes", segmento: "Creche / Pré-escola", alunos: 251 },
  { nome: "Nassib Cury Professor EMEB", bairro: "Fazenda Grande", segmento: "Fundamental I", alunos: 628 },
  { nome: "Nelson Alvaro Figueiredo Brito Prof. EMEB", bairro: "Jardim Guanabara", segmento: "Pré-escola", alunos: 71 },
  { nome: "Odila Richter Profa EMEB", bairro: "Bom Jardim", segmento: "Pré-escola / Fundamental I", alunos: 160 },
  { nome: "Oscar Augusto Guelli Prof. EMEB", bairro: "Roseira", segmento: "Pré-escola / Fundamental I", alunos: 274 },
  { nome: "Owen Zilio Prof. EMEB", bairro: "Jardim Martins", segmento: "Creche / Pré-escola", alunos: 177 },
  { nome: "Patricia Pires Profa EMEB", bairro: "Parque Centenário", segmento: "Creche / Pré-escola", alunos: 147 },
  { nome: "Pedro Clarismundo Fornari Prof. EMEB", bairro: "Rio Acima", segmento: "Fundamental I", alunos: 236 },
  { nome: "Pedro de Oliveira EMEB", bairro: "Vila Joana", segmento: "Fundamental I", alunos: 1069 },
  { nome: "Ramiro Araujo Filho Dr. EMEB", bairro: "Vianelo", segmento: "Creche / Pré-escola", alunos: 164 },
  { nome: "Ranieri Mazzilli Deputado EMEB", bairro: "Vila Esperança", segmento: "Fundamental I", alunos: 244 },
  { nome: "Rotary Club EMEB", bairro: "Anhangabaú", segmento: "Pré-escola", alunos: 201 },
  { nome: "Ruth Carturan Wiemann Profa EMEB", bairro: "Jardim Tarumã", segmento: "Pré-escola", alunos: 203 },
  { nome: "Rute Miranda Duarte Sirilo Profa EMEB", bairro: "Terra Nova", segmento: "Pré-escola / Fundamental I", alunos: 56 },
  { nome: "Ursula Gherello Irma EMEB", bairro: "Eloy Chaves", segmento: "Pré-escola / Fundamental I", alunos: 281 },
  { nome: "Vasco Antonio Venchiarutti Pref. EMEB", bairro: "Caxambu", segmento: "Creche / Pré-escola", alunos: 161 },
];

export const ESCOLAS_JUNDIAI = ESCOLAS_VOUCHER.map((escola) => escola.nome);

export type EscolaNome = (typeof ESCOLAS_JUNDIAI)[number];

export function fichaEscola(nome: string) {
  return ESCOLAS_VOUCHER.find((escola) => escola.nome === nome);
}
