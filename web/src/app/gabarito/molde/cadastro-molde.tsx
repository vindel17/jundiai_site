"use client";

import { useRef, useState, useTransition } from "react";
import { moldeDaFoto, type ResultadoMolde } from "@/lib/gabarito/molde/molde";
import { salvarMolde } from "./acoes";
import { desenharFoto, marcarFoto } from "./foto";
import { PreviaForma } from "./previa-forma";

type Medida = { comprimento: number; largura: number; real: boolean };

type Props<T extends string> = {
  tamanhos: readonly T[];
  tabela: Record<T, Medida>;
};

/** Acima disso, largura e comprimento contam histórias diferentes sobre a foto. */
const DIVERGENCIA_ALTA = 0.04;

const paraTexto = (v: number) => String(v).replace(".", ",");
const paraNumero = (texto: string) => Number(texto.replace(",", "."));
const cm = (v: number) => `${paraTexto(Math.round(v * 10) / 10)} cm`;

export function CadastroMolde<T extends string>({ tamanhos, tabela }: Props<T>) {
  const [tamanho, setTamanho] = useState<T>(tamanhos[0]);
  const [largura, setLargura] = useState(paraTexto(tabela[tamanhos[0]].largura));
  const [comprimento, setComprimento] = useState(paraTexto(tabela[tamanhos[0]].comprimento));
  const [foto, setFoto] = useState<ImageBitmap | null>(null);
  const [resultado, setResultado] = useState<ResultadoMolde | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [salvando, iniciarSalvar] = useTransition();
  const canvas = useRef<HTMLCanvasElement>(null);

  function trocarTamanho(t: T) {
    setTamanho(t);
    setLargura(paraTexto(tabela[t].largura));
    setComprimento(paraTexto(tabela[t].comprimento));
    setResultado(null);
    setMensagem("");
  }

  async function escolherFoto(arquivo: File | undefined) {
    setResultado(null);
    setMensagem("");
    if (!arquivo) return setFoto(null);
    try {
      setFoto(await createImageBitmap(arquivo));
    } catch {
      setFoto(null);
      setMensagem("Não consegui abrir essa foto. Tente em JPG ou PNG.");
    }
  }

  function gerar() {
    const l = paraNumero(largura);
    const c = paraNumero(comprimento);
    if (!canvas.current || !foto) return;
    if (!(l > 0 && c > 0)) return setMensagem("Informe a largura e o comprimento em cm.");
    setMensagem("");
    const novo = moldeDaFoto(desenharFoto(canvas.current, foto), { largura: l, comprimento: c });
    if ("forma" in novo) marcarFoto(canvas.current, novo.contornoFoto, novo.marcasFoto);
    setResultado(novo);
  }

  function salvar() {
    if (!resultado || !("forma" in resultado)) return;
    iniciarSalvar(async () => {
      const { erro } = await salvarMolde(tamanho, resultado.forma);
      setMensagem(
        erro ?? `Molde do ${tamanho} salvo. Abra /gabarito/teste para conferir em AR.`,
      );
    });
  }

  const comMolde = tamanhos.filter((t) => tabela[t].real);

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Tamanho da camiseta" className="flex flex-wrap gap-2">
        {tamanhos.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={t === tamanho}
            onClick={() => trocarTamanho(t)}
            className={t === tamanho ? "btn-primary" : "btn-secondary"}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {comMolde.length
          ? `Já têm molde de foto: ${comMolde.join(", ")}.`
          : "Nenhum tamanho tem molde de foto ainda."}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="field">
          Largura na axila (cm)
          <input inputMode="decimal" value={largura} onChange={(e) => setLargura(e.target.value)} />
        </label>
        <label className="field">
          Comprimento, ombro à barra (cm)
          <input inputMode="decimal" value={comprimento} onChange={(e) => setComprimento(e.target.value)} />
        </label>
      </div>
      <label className="field">
        Foto da camiseta {tamanho}
        <input type="file" accept="image/*" onChange={(e) => escolherFoto(e.target.files?.[0])} />
      </label>

      <button type="button" className="btn-primary" onClick={gerar} disabled={!foto}>
        Gerar contorno
      </button>

      <canvas
        ref={canvas}
        aria-label="Foto com o contorno encontrado"
        style={{ width: "100%", height: "auto", borderRadius: 12, display: foto ? "block" : "none" }}
      />

      {resultado && "erro" in resultado && (
        <p role="alert" className="form-error">
          {resultado.erro}
        </p>
      )}
      {resultado && "forma" in resultado && (
        <Resultado resultado={resultado} tamanho={tamanho} salvando={salvando} aoSalvar={salvar} />
      )}
      {mensagem && <p role="status">{mensagem}</p>}
    </div>
  );
}

type PropsResultado = {
  resultado: Extract<ResultadoMolde, { forma: unknown }>;
  tamanho: string;
  salvando: boolean;
  aoSalvar: () => void;
};

function Resultado({ resultado: { forma, divergencia }, tamanho, salvando, aoSalvar }: PropsResultado) {
  const porcento = `${paraTexto(Math.round(divergencia * 1000) / 10)}%`;
  return (
    <div className="flex flex-col gap-3">
      {divergencia > DIVERGENCIA_ALTA ? (
        <p role="alert" className="form-error">
          A largura e o comprimento informados não batem com a proporção da foto (diferença de{" "}
          {porcento}). Confira as medidas e se a foto foi tirada bem de cima, com o celular paralelo
          ao chão.
        </p>
      ) : (
        <p className="text-sm">Foto e medidas conferem (diferença de {porcento}).</p>
      )}
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Pontos amarelos na foto: gola, ombros, axilas e barra. Gola com {cm(forma.larguraGola)} de
        largura; axila {cm(forma.alturaCava)} abaixo do ombro.
      </p>
      <PreviaForma forma={forma} />
      <button type="button" className="btn-primary" onClick={aoSalvar} disabled={salvando}>
        {salvando ? "Salvando…" : `Salvar molde do ${tamanho}`}
      </button>
    </div>
  );
}
