"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { publicarAnuncio, type EstadoAcao } from "@/app/doacao/acoes";
import { TAMANHOS } from "@/data/catalogo";
import { ESCOLAS_JUNDIAI } from "@/data/escolas";
import { DOACAO_MODELOS } from "@/lib/doacao/modelos";

const INICIAL: EstadoAcao = {};

export function DoarForm() {
  const [estado, acao, pendente] = useActionState(publicarAnuncio, INICIAL);
  const [preview, setPreview] = useState<string | null>(null);

  if (estado.ok) {
    return (
      <main className="uj-page">
        <Link href="/" className="uj-back">
          ← Início
        </Link>
        <div className="uj-success">
          <h2>Anúncio no ar</h2>
          <p>
            Quem procura esse tamanho já consegue ver a peça. Quando alguém pedir,
            você aceita na conta e o WhatsApp só aparece depois do aceite.
          </p>
          <Link href="/doacao/receber" className="btn-primary">
            Ver o feed
          </Link>
        </div>

        <div className="uj-reward">
          <strong>Falta 1 de 2 doações</strong>
          <p>
            Complete com outra família e resgate uma camiseta nova no tamanho do
            seu filho.
          </p>
          <div className="uj-reward-dots" aria-hidden>
            <i data-on="true" />
            <i data-on="false" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="uj-page">
      <Link href="/" className="uj-back">
        ← Início
      </Link>
      <h1 className="uj-page-title">
        Tem uniforme parado? Alguém está procurando ele agora
      </h1>
      <p className="uj-page-lead">
        Leva menos de um minuto: foto, tamanho e escola. Duas doações concluídas
        valem uma peça nova para o seu filho.
      </p>

      <form className="uj-form" action={acao}>
        <div className="uj-field">
          <label htmlFor="doar-foto">Foto da peça</label>
          <label className="doacao-photo-slot" data-filled={preview ? "true" : "false"}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Prévia da peça" />
            ) : (
              <>
                <b>Toque para enviar a foto</b>
                Anúncio com foto é aceito muito mais rápido
              </>
            )}
            <input
              id="doar-foto"
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              required
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </label>
        </div>

        <div className="uj-field">
          <label htmlFor="doar-modelo">Qual peça você vai doar?</label>
          <select id="doar-modelo" name="modelo" required defaultValue="">
            <option value="" disabled>
              Escolha a peça
            </option>
            {DOACAO_MODELOS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="uj-field-row">
          <div className="uj-field">
            <label htmlFor="doar-tamanho">Tamanho</label>
            <select id="doar-tamanho" name="tamanho" required defaultValue="">
              <option value="" disabled>
                Tam.
              </option>
              {TAMANHOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="uj-field">
            <label htmlFor="doar-qtd">Quantidade</label>
            <input
              id="doar-qtd"
              name="quantidade"
              type="number"
              min={1}
              max={10}
              defaultValue={1}
              required
            />
          </div>
        </div>

        <div className="uj-field">
          <label htmlFor="doar-escola">Escola do aluno</label>
          <input
            id="doar-escola"
            name="escola"
            list="escolas-doacao"
            placeholder="Digite ou escolha a EMEB"
            required
            autoComplete="off"
          />
          <datalist id="escolas-doacao">
            {ESCOLAS_JUNDIAI.slice(0, 80).map((nome) => (
              <option key={nome} value={nome} />
            ))}
          </datalist>
        </div>

        <div className="uj-field">
          <label htmlFor="doar-estado">Como está a peça?</label>
          <select id="doar-estado" name="estado" defaultValue="bom">
            <option value="bom">Boa — dá para usar sem reparo</option>
            <option value="regular">Regular — tem marca de uso</option>
          </select>
        </div>

        {estado.erro ? <p className="entrar-erro">{estado.erro}</p> : null}

        <button type="submit" className="btn-primary" disabled={pendente}>
          {pendente ? "Publicando..." : "Publicar minha doação"}
        </button>
      </form>

      <ul className="uj-checklist">
        <li>
          <span className="uj-check" aria-hidden>
            ✓
          </span>
          <span>
            <b>Seu telefone só aparece para quem você aceitar</b> — o anúncio
            não mostra contato.
          </span>
        </li>
        <li>
          <span className="uj-check" aria-hidden>
            ✓
          </span>
          <span>
            <b>Você escolhe para quem doar</b> — combina a retirada direto com a
            família.
          </span>
        </li>
        <li>
          <span className="uj-check" aria-hidden>
            ✓
          </span>
          <span>
            <b>Uma doação por família</b> conta para a recompensa, para o
            benefício alcançar mais gente.
          </span>
        </li>
      </ul>
    </main>
  );
}
