-- Prova social — avaliações de quem comprou (estrelas, comentário, fotos)
-- Sem tabela de pedido ainda: a família declara a compra; compra_verificada
-- fica pronta para quando o checkout persistir no banco.

create type public.status_avaliacao as enum ('pendente', 'aprovada', 'ocultada');

create table public.avaliacao (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  modelo_id text not null,
  -- primeiro nome só (evita expor perfil completo na vitrine pública)
  autor_nome text not null check (char_length(trim(autor_nome)) between 1 and 40),
  nota smallint not null check (nota between 1 and 5),
  comentario text not null check (char_length(trim(comentario)) between 10 and 500),
  status public.status_avaliacao not null default 'aprovada',
  -- true quando houver pedido pago/entregue ligado a esta avaliação
  compra_verificada boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint avaliacao_unica_por_peca unique (perfil_id, modelo_id)
);

create index avaliacao_publica_idx
  on public.avaliacao (status, modelo_id, criado_em desc);

create index avaliacao_perfil_id_idx on public.avaliacao (perfil_id);

create trigger avaliacao_atualizado_em
  before update on public.avaliacao
  for each row execute function public.tocar_atualizado_em();

create table public.avaliacao_foto (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacao (id) on delete cascade,
  storage_path text not null,
  criado_em timestamptz not null default now()
);

create index avaliacao_foto_avaliacao_id_idx
  on public.avaliacao_foto (avaliacao_id);

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------
alter table public.avaliacao enable row level security;
alter table public.avaliacao_foto enable row level security;

-- Vitrine pública (compra sem login ainda)
create policy "avaliacao: leitura pública das aprovadas"
  on public.avaliacao for select
  using (
    status = 'aprovada'
    or perfil_id = (select auth.uid())
  );

create policy "avaliacao: dono cria"
  on public.avaliacao for insert to authenticated
  with check (perfil_id = (select auth.uid()));

create policy "avaliacao: dono edita a própria"
  on public.avaliacao for update to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));

create policy "avaliacao_foto: leitura com a avaliação"
  on public.avaliacao_foto for select
  using (
    exists (
      select 1
      from public.avaliacao a
      where a.id = avaliacao_id
        and (
          a.status = 'aprovada'
          or a.perfil_id = (select auth.uid())
        )
    )
  );

create policy "avaliacao_foto: dono anexa"
  on public.avaliacao_foto for insert to authenticated
  with check (
    exists (
      select 1
      from public.avaliacao a
      where a.id = avaliacao_id
        and a.perfil_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------
-- Storage das fotos da avaliação
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avaliacoes', 'avaliacoes', true)
on conflict (id) do nothing;

create policy "avaliacoes: leitura pública"
  on storage.objects for select
  using (bucket_id = 'avaliacoes');

create policy "avaliacoes: upload do dono"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avaliacoes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avaliacoes: dono remove"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avaliacoes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------
-- Resumo por peça (média + quantidade)
-- ---------------------------------------------------------------
create or replace function public.resumo_avaliacoes(p_modelo_id text default null)
returns table (
  modelo_id text,
  media numeric,
  total bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.modelo_id,
    round(avg(a.nota)::numeric, 1) as media,
    count(*)::bigint as total
  from public.avaliacao a
  where a.status = 'aprovada'
    and (p_modelo_id is null or a.modelo_id = p_modelo_id)
  group by a.modelo_id;
$$;
