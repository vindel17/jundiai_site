"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { criarReservaSite, type EstadoReserva } from "@/app/reserva/acoes";
import { CardPeca, FotoPeca } from "@/app/reserva/reserva-pecas";
import { ESCOLAS_JUNDIAI } from "@/data/escolas";
import { regraDoFrete } from "@/lib/reserva/entrega";
import {
  SEM_PECA,
  TAMANHOS_KIT,
  pecasDoKit,
  rotuloKit,
  type KitGenero,
  type PecaKit,
} from "@/lib/reserva/kit";

const INICIAL: EstadoReserva = {};

const OPCOES_KIT: { kit: KitGenero; catalogoId: string; nome: string }[] = [
  { kit: "masculino", catalogoId: "bermuda", nome: "Bermuda" },
  { kit: "feminino", catalogoId: "short-saia", nome: "Short-saia" },
];

const OPCOES_ENTREGA = [
  { valor: "casa", nome: "Receber em casa", detalhe: "Grátis com o kit completo" },
  { valor: "loja", nome: "Retirar na loja", detalhe: "Sem custo" },
];

/** `fotosKit` traz a foto do kit inteiro quando ela já está em /public/produtos. */
export function ReservaForm({ fotosKit }: { fotosKit: Partial<Record<KitGenero, string>> }) {
  const [kit, setKit] = useState<KitGenero>("masculino");
  const [estado, acao, pendente] = useActionState(criarReservaSite, INICIAL);

  return (
    <form className="reserva-form" action={acao}>
      <section className="reserva-bloco">
        <h2 className="reserva-passo">
          <i aria-hidden>1</i> Quem vai usar o uniforme
        </h2>
        <div className="uj-field">
          <label htmlFor="reserva-escola">Nome da escola</label>
          <select id="reserva-escola" name="escola" required defaultValue="">
            <option value="" disabled>
              Encontre a escola na lista
            </option>
            {ESCOLAS_JUNDIAI.map((escola) => (
              <option key={escola} value={escola}>
                {escola}
              </option>
            ))}
          </select>
        </div>
        <div className="uj-field">
          <label htmlFor="reserva-aluno">Primeiro nome de quem vai usar o uniforme</label>
          <input id="reserva-aluno" name="aluno" required minLength={2} maxLength={40} />
        </div>
      </section>

      <section className="reserva-bloco">
        <h2 className="reserva-passo" id="reserva-kit-titulo">
          <i aria-hidden>2</i> Você prefere bermuda ou short-saia?
        </h2>
        <div className="reserva-opcoes" role="radiogroup" aria-labelledby="reserva-kit-titulo">
          {OPCOES_KIT.map((opcao) => (
            <label key={opcao.kit} className="reserva-opcao">
              <input
                type="radio"
                name="kit"
                value={opcao.kit}
                checked={kit === opcao.kit}
                onChange={() => setKit(opcao.kit)}
              />
              {fotosKit[opcao.kit] ? (
                <div className="reserva-peca-foto">
                  <Image
                    src={fotosKit[opcao.kit]!}
                    alt={`Kit ${rotuloKit(opcao.kit).toLowerCase()}`}
                    width={480}
                    height={360}
                  />
                </div>
              ) : (
                <FotoPeca catalogoId={opcao.catalogoId} nome={opcao.nome} />
              )}
              <b>{rotuloKit(opcao.kit)}</b>
            </label>
          ))}
        </div>
      </section>

      <section className="reserva-bloco">
        <h2 className="reserva-passo">
          <i aria-hidden>3</i> Tamanho de cada peça
        </h2>
        <ul className="reserva-lista">
          {pecasDoKit(kit).map((peca) => (
            <CardPeca key={peca.chave} peca={peca}>
              <Tamanho peca={peca} />
            </CardPeca>
          ))}
        </ul>
        <p className="reserva-dica">
          As duas camisetas de manga curta são do mesmo tamanho. Se não precisar de uma peça,
          escolha “Não quero esta peça”. Antes de comprar, você pode trocar o tamanho se tivermos
          a peça no tamanho que você precisa.
        </p>
      </section>

      <section className="reserva-bloco">
        <h2 className="reserva-passo" id="reserva-entrega-titulo">
          <i aria-hidden>4</i> Como prefere receber?
        </h2>
        <div
          className="reserva-opcoes"
          role="radiogroup"
          aria-labelledby="reserva-entrega-titulo"
        >
          {OPCOES_ENTREGA.map((opcao) => (
            <label key={opcao.valor} className="reserva-opcao reserva-opcao-texto">
              <input type="radio" name="entrega" value={opcao.valor} required />
              <b>{opcao.nome}</b>
              <small>{opcao.detalhe}</small>
            </label>
          ))}
        </div>
        <p className="reserva-dica">{regraDoFrete()} Você pode mudar sua escolha depois.</p>
      </section>

      <div className="reserva-enviar">
        {estado.erro ? <p className="entrar-erro">{estado.erro}</p> : null}
        <button className="btn-primary" type="submit" disabled={pendente}>
          {pendente ? "Reservando..." : "Confirmar minha reserva"}
        </button>
        <p className="reserva-dica">Reservar é de graça. Você decide depois se quer comprar.</p>
      </div>
    </form>
  );
}

function tituloDaPeca(peca: PecaKit) {
  return peca.quantidade > 1 ? `${peca.nome} (2 peças)` : peca.nome;
}

function Tamanho({ peca }: { peca: PecaKit }) {
  const id = `reserva-${peca.chave}`;
  return (
    <div className="uj-field">
      <label htmlFor={id}>{tituloDaPeca(peca)}</label>
      <select id={id} name={peca.chave} required defaultValue="10">
        {TAMANHOS_KIT.map((tamanho) => (
          <option key={tamanho} value={tamanho}>
            {tamanho}
          </option>
        ))}
        <option value={SEM_PECA}>Não quero esta peça</option>
      </select>
    </div>
  );
}
