import { RECEITA_CAMISETA } from "./camiseta";
import { RECEITA_CINTURA } from "./cintura";
import type { Receita } from "./receita";

/** Uma foto da parte de cima e uma da parte de baixo cobrem todas as peças do kit. */
export type Parte = "cima" | "baixo";

export const RECEITAS: Record<Parte, Receita> = { cima: RECEITA_CAMISETA, baixo: RECEITA_CINTURA };
