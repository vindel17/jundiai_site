"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarPerfil, type EstadoPerfil } from "@/app/conta/acoes";
import { TAMANHOS } from "@/data/catalogo";
import { ESCOLAS_JUNDIAI } from "@/data/escolas";
import { rotuloDoDestino } from "@/lib/rotas";

const INICIAL: EstadoPerfil = {};

/** `proximo` traz de volta o fluxo que trouxe o usuário até aqui. */
export function PerfilForm({ proximo }: { proximo?: string }) {
  const [estado, acao, pendente] = useActionState(salvarPerfil, INICIAL);
  const destino = proximo ?? "/doacao/doar";

  if (estado.ok) {
    return (
      <div className="uj-success">
        <h2>Perfil completo</h2>
        <p>
          Agora dá para anunciar uma peça ou avisar o que você procura — a gente te
          chama assim que aparecer.
          {estado.etiquetas ? (
            <>
              {" "}
              Você ganhou <b>1 etiqueta</b> de boas-vindas. Peça em{" "}
              <Link href="/etiquetas">Etiquetas</Link>.
            </>
          ) : null}
        </p>
        <Link href={destino} className="btn-primary">
          {rotuloDoDestino(destino)}
        </Link>
      </div>
    );
  }

  return (
    <form className="entrar-form" action={acao}>
      <div className="uj-field">
        <label htmlFor="nomeResponsavel">Seu nome</label>
        <input
          id="nomeResponsavel"
          name="nomeResponsavel"
          placeholder="Nome do responsável"
          required
        />
      </div>

      <div className="uj-field">
        <label htmlFor="filhoNome">Nome do aluno</label>
        <input id="filhoNome" name="filhoNome" placeholder="Nome do seu filho" required />
      </div>

      <div className="uj-field">
        <label htmlFor="filhoEscola">Escola</label>
        <input
          id="filhoEscola"
          name="filhoEscola"
          list="escolas-perfil"
          placeholder="Digite ou escolha a EMEB"
          autoComplete="off"
          required
        />
        <datalist id="escolas-perfil">
          {ESCOLAS_JUNDIAI.slice(0, 80).map((nome) => (
            <option key={nome} value={nome} />
          ))}
        </datalist>
      </div>

      <div className="uj-field">
        <label htmlFor="filhoTamanho">Tamanho que ele usa hoje (opcional)</label>
        <select id="filhoTamanho" name="filhoTamanho" defaultValue="">
          <option value="">Não sei agora</option>
          {TAMANHOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {estado.erro && <p className="entrar-erro">{estado.erro}</p>}

      <button type="submit" className="btn-primary" disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar e continuar"}
      </button>

      <p className="entrar-nota">
        Guardamos isso para achar a peça certa para você e avisar quando ela aparecer.
        Endereço e pagamento só entram se você comprar algo.
      </p>
    </form>
  );
}
