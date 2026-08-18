"use client";

import Link from "next/link";
import { useState } from "react";
import { CATALOGO } from "@/data/catalogo";
import {
  criarAvaliacao,
  type EstadoAvaliacao,
} from "@/app/conta/avaliar/acoes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Estrelas } from "./estrelas";

const MAX_FOTOS = 3;
const MAX_BYTES = 4 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);

type Props = {
  modeloPadrao?: string;
  logado: boolean;
};

function extensao(tipo: string): string {
  if (tipo === "image/png") return "png";
  if (tipo === "image/webp") return "webp";
  return "jpg";
}

export function AvaliacaoForm({ modeloPadrao, logado }: Props) {
  const [nota, setNota] = useState(5);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [estado, setEstado] = useState<EstadoAvaliacao>({});
  const [pending, setPending] = useState(false);

  if (!logado) {
    return (
      <div className="ps-form-gate">
        <p>
          Para avaliar, entre com o WhatsApp que você usou na compra. Só quem já
          comprou deve deixar avaliação.
        </p>
        <Link
          href={`/entrar?proximo=${encodeURIComponent("/conta/avaliar")}`}
          className="btn-primary"
        >
          Entrar para avaliar
        </Link>
      </div>
    );
  }

  if (estado.ok) {
    return (
      <div className="ps-form-ok">
        <h3>Obrigado pela avaliação</h3>
        <p>
          Sua opinião e as fotos ajudam outras famílias a escolher com mais
          confiança.
        </p>
        <Link href="/comprar" className="btn-primary">
          Voltar à loja
        </Link>
      </div>
    );
  }

  function onFotos(files: FileList | null) {
    setEstado({});
    if (!files) {
      setArquivos([]);
      setPreviews([]);
      return;
    }
    const lista = Array.from(files).slice(0, MAX_FOTOS);
    setArquivos(lista);
    setPreviews(lista.map((f) => URL.createObjectURL(f)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado({});
    setPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      for (const arquivo of arquivos) {
        if (!TIPOS.has(arquivo.type)) {
          setEstado({ erro: "Use fotos JPG, PNG ou WEBP." });
          return;
        }
        if (arquivo.size > MAX_BYTES) {
          setEstado({ erro: "Cada foto pode ter no máximo 4 MB." });
          return;
        }
      }

      const paths: string[] = [];
      if (arquivos.length > 0) {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setEstado({ erro: "Sessão expirada. Entre de novo." });
          return;
        }

        const lote = crypto.randomUUID();
        for (let i = 0; i < arquivos.length; i++) {
          const arquivo = arquivos[i];
          const path = `${user.id}/${lote}/${i + 1}.${extensao(arquivo.type)}`;
          const { error } = await supabase.storage
            .from("avaliacoes")
            .upload(path, arquivo, {
              contentType: arquivo.type,
              upsert: false,
            });
          if (error) {
            setEstado({
              erro: "Não conseguimos enviar as fotos. Tente de novo.",
            });
            return;
          }
          paths.push(path);
        }
      }

      formData.set("fotosPaths", JSON.stringify(paths));
      formData.delete("fotos");
      const resultado = await criarAvaliacao({}, formData);
      setEstado(resultado);
    } catch {
      setEstado({ erro: "Algo deu errado. Tente de novo." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="uj-form ps-form" onSubmit={onSubmit}>
      <div className="uj-field">
        <label htmlFor="avaliar-modelo">Qual peça você comprou?</label>
        <select
          id="avaliar-modelo"
          name="modeloId"
          required
          defaultValue={modeloPadrao ?? ""}
        >
          <option value="" disabled>
            Escolha a peça
          </option>
          {CATALOGO.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="uj-field">
        <span className="ps-label">Sua nota</span>
        <Estrelas
          nota={nota}
          tamanho="lg"
          interativo
          onChange={setNota}
          nome="nota"
        />
      </div>

      <div className="uj-field">
        <label htmlFor="avaliar-comentario">Como foi a experiência?</label>
        <textarea
          id="avaliar-comentario"
          name="comentario"
          required
          minLength={10}
          maxLength={500}
          rows={4}
          placeholder="Conte sobre o tecido, o caimento, a entrega…"
        />
      </div>

      <div className="uj-field">
        <label htmlFor="avaliar-fotos">Fotos do uniforme (opcional)</label>
        <input
          id="avaliar-fotos"
          name="fotos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => onFotos(e.target.files)}
        />
        <p className="ps-hint">Até 3 fotos · JPG, PNG ou WEBP · máx. 4 MB cada</p>
        {previews.length > 0 ? (
          <ul className="ps-preview-grid">
            {previews.map((src) => (
              <li key={src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="ps-check">
        <input type="checkbox" name="confirmouCompra" value="sim" required />
        <span>Confirmo que já comprei esta peça com a Espaço Livre</span>
      </label>

      {estado.erro ? (
        <p className="uj-error" role="alert">
          {estado.erro}
        </p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Enviando…" : "Publicar avaliação"}
      </button>
    </form>
  );
}
