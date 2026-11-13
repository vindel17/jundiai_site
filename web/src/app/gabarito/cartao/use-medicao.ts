"use client";

import { useEffect, useRef, useState } from "react";
import type { Quadrilatero } from "@/lib/gabarito/cartao/homografia";
import type { Pontos } from "@/lib/gabarito/cartao/receita";
import type { Parte } from "@/lib/gabarito/cartao/receitas";
import type { Ponto } from "@/lib/gabarito/glb";
import { desenharFoto } from "../molde/foto";
import { criarMedidor, type Medidor } from "./medidor";
import { cartaoPadrao } from "./padrao";
import { PARTES } from "./partes";

/** A foto é medida com o lado maior até aqui: cabe no limite de memória do iPhone e mantém o detalhe do cartão. */
const LADO_DE_MEDIDA = 4096;
/** Lado maior da foto mostrada na tela, em pixels. */
const LADO_NA_TELA = 1200;

export type Leitura = {
  /** Tamanho da foto como saiu da câmera e como foi medida, em pixels */
  original: [number, number];
  medida: [number, number];
  /** Tempo do processamento, em milissegundos */
  tempo: number;
  /** Desfoque da borda do cartão, em pixels. `null` se o cartão não foi achado sozinho. */
  desfoque: number | null;
  pontosCorrigidos: boolean;
  /** Cantos do cartão marcados com o dedo, sem encaixe nas bordas */
  cartaoSolto: boolean;
};

type Marcas = { pontos: Pontos; cartao: Quadrilatero };

/** O que a leitura automática deixou pronto quando não conseguiu medir sozinha. */
type Falha = { erro: string; pontos?: Pontos };

export type MedicaoDaParte = ReturnType<typeof useMedicao>;

/** A foto de uma parte do kit: a leitura automática, as marcas e a correção delas à mão. */
export function useMedicao(parte: Parte) {
  const { receita, pontosPadrao } = PARTES[parte];
  const [ocupado, setOcupado] = useState(false);
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [contorno, setContorno] = useState<Ponto[] | null>(null);
  const [marcas, setMarcas] = useState<Marcas | null>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  /** A pessoa decidiu medir com os cantos do cartão onde os deixou, sem encaixe nas bordas. */
  const [cantosAceitos, setCantosAceitos] = useState(false);
  const medidor = useRef<Medidor | null>(null);

  useEffect(() => () => medidor.current?.encerrar(), []);

  /** Alguns pontos dependem da escala do cartão: mudam de lugar quando ele ou os vizinhos mudam. */
  const ajustar = (pontos: Pontos, cartao: Quadrilatero, movido?: string) =>
    receita.ajustar?.(pontos, cartao, contorno, movido) ?? pontos;

  /** Mede a foto escolhida e a desenha no canvas da tela. */
  async function medirFoto(arquivo: File | undefined, tela: HTMLCanvasElement | null) {
    if (!arquivo || !tela) return;
    setOcupado(true);
    setLeitura(null);
    setContorno(null);
    setMarcas(null);
    setFalha(null);
    setCantosAceitos(false);
    try {
      const foto = await createImageBitmap(arquivo);
      const rascunho = document.createElement("canvas");
      const imagem = desenharFoto(rascunho, foto, LADO_DE_MEDIDA);
      rascunho.width = 0;
      desenharFoto(tela, foto, LADO_NA_TELA);
      const base = {
        original: [foto.width, foto.height] as [number, number],
        medida: [imagem.largura, imagem.altura] as [number, number],
        pontosCorrigidos: false,
      };
      foto.close();

      medidor.current ??= criarMedidor();
      const inicio = performance.now();
      const resultado = await medidor.current.medir(parte, imagem);
      const tempo = performance.now() - inicio;
      setContorno(resultado.contornoFoto ?? null);
      if ("erro" in resultado) {
        setLeitura({ ...base, tempo, desfoque: null, cartaoSolto: true });
        setFalha({ erro: resultado.erro, pontos: resultado.pontosFoto });
      } else {
        setLeitura({ ...base, tempo, desfoque: resultado.desfoque, cartaoSolto: false });
        setMarcas({ pontos: resultado.pontosFoto, cartao: resultado.cartaoFoto });
      }
    } catch {
      setFalha({ erro: "Não consegui abrir essa foto. Tente de novo, em JPG ou PNG." });
    } finally {
      setOcupado(false);
    }
  }

  function marcarNaMao() {
    if (!leitura) return;
    const [largura, altura] = leitura.medida;
    setMarcas({ pontos: falha?.pontos ?? pontosPadrao(largura, altura), cartao: cartaoPadrao(largura, altura) });
    setFalha(null);
  }

  function moverPonto(nome: string, ponto: Ponto) {
    setMarcas((m) => m && { ...m, pontos: ajustar({ ...m.pontos, [nome]: ponto }, m.cartao, nome) });
    setLeitura((l) => l && { ...l, pontosCorrigidos: true });
  }

  function moverCanto(indice: number, ponto: Ponto) {
    setMarcas((m) => {
      if (!m) return m;
      const cartao = m.cartao.map((c, i) => (i === indice ? ponto : c)) as Quadrilatero;
      return { cartao, pontos: ajustar(m.pontos, cartao) };
    });
    setLeitura((l) => l && { ...l, cartaoSolto: true });
  }

  /** Canto solto perto da ponta do cartão: o processamento leva os quatro até as bordas. */
  async function encaixarCartao() {
    if (!marcas || !medidor.current) return;
    const cartao = await medidor.current.encaixar(marcas.cartao);
    if (!cartao) return;
    setMarcas((m) => m && { cartao, pontos: ajustar(m.pontos, cartao) });
    setLeitura((l) => l && { ...l, cartaoSolto: false });
    setCantosAceitos(false);
  }

  const medidas = marcas && receita.medir(marcas.pontos, marcas.cartao);
  const cartaoNoLugar = Boolean(leitura && !leitura.cartaoSolto) || cantosAceitos;

  return {
    ocupado,
    leitura,
    contorno,
    marcas,
    falha,
    /** `null` enquanto os cantos do cartão não permitem medir */
    medidas,
    /** As medidas, quando já dá para confiar no cartão ou a pessoa aceitou os cantos como estão */
    resultado: cartaoNoLugar ? medidas : null,
    cantosAceitos,
    medirFoto,
    marcarNaMao,
    moverPonto,
    moverCanto,
    encaixarCartao,
    aceitarCantos: () => setCantosAceitos(true),
  };
}
