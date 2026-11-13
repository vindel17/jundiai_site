"use client";

import { useRef } from "react";
import type { Parte } from "@/lib/gabarito/cartao/receitas";
import type { Ponto } from "@/lib/gabarito/glb";
import { Marcacao } from "./marcacao";
import { PARTES, type Ponta } from "./partes";
import { Resultado } from "./resultado";
import type { MedicaoDaParte } from "./use-medicao";

type Props = { parte: Parte; medicao: MedicaoDaParte };

/** A foto de uma parte do kit: como tirar, as marcas por cima dela e o que foi medido. */
export function FotoMedida({ parte, medicao }: Props) {
  const config = PARTES[parte];
  const { ocupado, leitura, marcas, falha, medidas, resultado } = medicao;
  const tela = useRef<HTMLCanvasElement>(null);
  const medirFoto = (arquivo: File | undefined) => medicao.medirFoto(arquivo, tela.current);
  const lugar = (ponta: Ponta, pontos: Record<string, Ponto>): Ponto => {
    if (typeof ponta === "string") return pontos[ponta];
    const [a, b] = [pontos[ponta[0]], pontos[ponta[1]]];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {config.passos.map((passo) => (
          <li key={passo}>{passo}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <BotaoDeFoto rotulo="Tirar a foto" principal camera ocupado={ocupado} aoEscolher={medirFoto} />
        <BotaoDeFoto rotulo="Usar foto da galeria" ocupado={ocupado} aoEscolher={medirFoto} />
      </div>
      {ocupado && <p role="status">Medindo a foto…</p>}

      <div style={{ position: "relative", display: leitura ? "block" : "none" }}>
        <canvas
          ref={tela}
          aria-label={`Foto da ${config.nome} com o cartão`}
          style={{ display: "block", width: "100%", height: "auto", borderRadius: 12 }}
        />
        {leitura && marcas && (
          <Marcacao
            largura={leitura.medida[0]}
            altura={leitura.medida[1]}
            contorno={medicao.contorno}
            alcas={Object.entries(config.alcas).map(([id, nome]) => ({ id, nome, ponto: marcas.pontos[id] }))}
            linhas={config.linhas.map(([de, ate]) => [lugar(de, marcas.pontos), lugar(ate, marcas.pontos)])}
            cartao={marcas.cartao}
            aoMoverPonto={medicao.moverPonto}
            aoMoverCanto={medicao.moverCanto}
            aoSoltarCanto={medicao.encaixarCartao}
          />
        )}
      </div>

      {falha && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="form-error">
            {falha.erro}
          </p>
          {leitura && (
            <button type="button" className="btn-secondary" onClick={medicao.marcarNaMao}>
              Marcar os pontos na mão
            </button>
          )}
        </div>
      )}
      {marcas && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Dá para corrigir arrastando: os pontos amarelos são os pontos de medida da peça; os verdes são os
          cantos do cartão. Para acertar o cartão, dê zoom na foto com dois dedos.
        </p>
      )}
      {marcas && !medidas && (
        <p role="alert" className="form-error">
          Não dá para medir com as marcas assim. Leve cada ponto verde a uma ponta do cartão e confira se os
          amarelos não estão um em cima do outro.
        </p>
      )}
      {leitura?.cartaoSolto && marcas && !medicao.cantosAceitos && (
        <div className="flex flex-col gap-3">
          <p>
            Leve cada ponto verde até uma ponta do cartão. Quando os quatro estiverem perto, eles se encaixam
            sozinhos nas bordas e a medida aparece.
          </p>
          <button type="button" className="btn-secondary" onClick={medicao.aceitarCantos}>
            Medir com os cantos como estão
          </button>
        </div>
      )}
      {leitura && marcas && resultado && (
        <Resultado parte={parte} medidas={resultado} cartao={marcas.cartao} leitura={leitura} />
      )}
    </div>
  );
}

type PropsBotao = {
  rotulo: string;
  principal?: boolean;
  /** Abre direto a câmera de trás do celular */
  camera?: boolean;
  ocupado: boolean;
  aoEscolher: (arquivo: File | undefined) => void;
};

/** Botão que abre a câmera ou a galeria. O campo de arquivo fica escondido dentro dele. */
function BotaoDeFoto({ rotulo, principal, camera, ocupado, aoEscolher }: PropsBotao) {
  return (
    <label
      className={`${principal ? "btn-primary" : "btn-secondary"} focus-within:outline-2 focus-within:outline-offset-2`}
      style={{ cursor: ocupado ? "wait" : "pointer", opacity: ocupado ? 0.6 : 1 }}
    >
      {rotulo}
      <input
        type="file"
        accept="image/*"
        capture={camera ? "environment" : undefined}
        disabled={ocupado}
        className="sr-only"
        onChange={(evento) => {
          aoEscolher(evento.target.files?.[0]);
          // Deixa escolher a mesma foto de novo.
          evento.target.value = "";
        }}
      />
    </label>
  );
}
