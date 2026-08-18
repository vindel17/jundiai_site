import type { Metadata } from "next";
import Link from "next/link";
import { FeedBorrado } from "@/components/doacao/feed-borrado";
import { FeedFiltros } from "@/components/doacao/feed-filtros";
import { ListaAnuncios, type AnuncioFeed } from "@/components/doacao/lista-anuncios";
import { ProcuroForm } from "@/components/doacao/procuro-form";
import type { FiltroReceber } from "@/lib/doacao/modelos";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Receber doação",
};

export default async function ReceberPage({
  searchParams,
}: {
  searchParams: Promise<{
    modelo?: string;
    tamanho?: string;
    escola?: string;
    aviso?: string;
  }>;
}) {
  const params = await searchParams;
  const filtro: FiltroReceber = {
    modelo: params.modelo || undefined,
    tamanho: params.tamanho || undefined,
    escola: params.escola?.trim() || undefined,
  };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="uj-page">
      <Link href="/" className="uj-back">
        ← Início
      </Link>
      <h1 className="uj-page-title">Peças disponíveis agora</h1>
      <p className="uj-page-lead">
        Achou o tamanho do seu filho? Peça a peça, o doador aceita, e aí o
        WhatsApp dos dois é liberado para combinar a retirada.
      </p>

      {params.aviso ? (
        <p className="entrar-erro" role="alert">
          {params.aviso}
        </p>
      ) : null}

      <FeedFiltros filtro={filtro} />

      {user ? (
        <FeedLogado filtro={filtro} userId={user.id} />
      ) : (
        <FeedAnonimo filtro={filtro} />
      )}

      <ProcuroForm logado={Boolean(user)} />

      <p className="uj-note">
        Precisa da peça para a semana que vem?{" "}
        <Link href="/comprar" className="uj-link">
          Veja o uniforme novo com preço de inauguração
        </Link>
        .
      </p>
    </main>
  );
}

async function FeedAnonimo({ filtro }: { filtro: FiltroReceber }) {
  if (!supabaseConfigurado) {
    return (
      <div className="doacao-empty">
        <strong>Feed ainda não conectado</strong>
        Configure o Supabase para ver as peças de verdade.
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: total } = await supabase.rpc("contar_anuncios_ativos", {
    p_modelo_id: filtro.modelo ?? "",
    p_tamanho: filtro.tamanho ?? "",
    p_escola: filtro.escola ?? "",
  });

  const n = total ?? 0;
  if (n === 0) {
    return (
      <div className="doacao-empty">
        <strong>Ninguém doou essa peça ainda</strong>
        Cadastre o que você procura logo abaixo: assim que alguém anunciar, você
        é a primeira pessoa avisada.
      </div>
    );
  }

  return <FeedBorrado total={n} filtro={filtro} />;
}

async function FeedLogado({
  filtro,
  userId,
}: {
  filtro: FiltroReceber;
  userId: string;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("anuncio")
    .select(
      "id, perfil_id, modelo_id, tamanho, quantidade, escola, estado, foto_path, criado_em",
    )
    .eq("status", "ativo")
    .order("criado_em", { ascending: false })
    // Teto para o feed não crescer sem limite conforme a base aumenta.
    .limit(60);

  if (filtro.modelo) query = query.eq("modelo_id", filtro.modelo);
  if (filtro.tamanho) query = query.eq("tamanho", filtro.tamanho);
  if (filtro.escola) query = query.ilike("escola", `%${filtro.escola}%`);

  const { data } = await query;
  const lista = (data ?? []) as AnuncioFeed[];

  return (
    <>
      <p className="doacao-results">
        <span>
          <b>{lista.length}</b>{" "}
          {lista.length === 1 ? "peça encontrada" : "peças encontradas"}
        </span>
      </p>
      {lista.length === 0 ? (
        <div className="doacao-empty">
          <strong>Ninguém doou essa peça ainda</strong>
          Cadastre o que você procura logo abaixo: assim que alguém anunciar,
          você é a primeira pessoa avisada.
        </div>
      ) : (
        <ListaAnuncios lista={lista} userId={userId} />
      )}
    </>
  );
}
