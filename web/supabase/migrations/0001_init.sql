-- Plataforma de doação — schema inicial
-- Regras: ../../../modelo-de-negocio.md · recompensas: ../../../recompensas.md
--
-- Funções SECURITY DEFINER ficam em `interno` (schema fora da Data API).
-- Quem chama pela API só enxerga wrappers em `public` com GRANT explícito.

create schema if not exists interno;
revoke all on schema interno from public;
revoke all on schema interno from anon, authenticated;

-- ---------------------------------------------------------------
-- Utilitário: atualizar `atualizado_em`
-- ---------------------------------------------------------------
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- perfil — 1 conta por celular verificado (auth.users)
-- ---------------------------------------------------------------
create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  telefone text not null,
  nome_responsavel text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index perfil_telefone_idx on public.perfil (telefone);

create trigger perfil_atualizado_em
  before update on public.perfil
  for each row execute function public.tocar_atualizado_em();

create or replace function interno.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, telefone)
  values (new.id, coalesce(new.phone, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function interno.criar_perfil_do_usuario();

-- ---------------------------------------------------------------
-- filho — vários por conta (nunca várias contas na mesma casa)
-- ---------------------------------------------------------------
create table public.filho (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  nome text not null,
  escola text not null,
  tamanho_atual text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index filho_perfil_id_idx on public.filho (perfil_id);
create index filho_escola_idx on public.filho (escola);

create trigger filho_atualizado_em
  before update on public.filho
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------
-- anuncio — peça oferecida para doação
-- ---------------------------------------------------------------
create type public.estado_peca as enum ('bom', 'regular');
create type public.status_anuncio as enum ('ativo', 'reservado', 'concluido', 'removido');

create table public.anuncio (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  modelo_id text not null,
  tamanho text not null,
  quantidade smallint not null default 1 check (quantidade between 1 and 10),
  escola text not null,
  estado public.estado_peca not null default 'bom',
  foto_path text,
  status public.status_anuncio not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index anuncio_busca_idx on public.anuncio (status, modelo_id, tamanho);
create index anuncio_escola_idx on public.anuncio (escola);
create index anuncio_perfil_id_idx on public.anuncio (perfil_id);

create trigger anuncio_atualizado_em
  before update on public.anuncio
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------
-- procuro — o que a família espera aparecer (dispara alerta)
-- ---------------------------------------------------------------
create table public.procuro (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  modelo_id text not null,
  tamanho text not null,
  escola text,
  ativo boolean not null default true,
  avisado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index procuro_match_idx on public.procuro (ativo, modelo_id, tamanho);
create index procuro_perfil_id_idx on public.procuro (perfil_id);
create unique index procuro_unico_ativo_idx
  on public.procuro (perfil_id, modelo_id, tamanho)
  where ativo;

create trigger procuro_atualizado_em
  before update on public.procuro
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------
-- doacao — o encontro entre doador e receptor
-- ---------------------------------------------------------------
create type public.status_doacao as enum ('combinando', 'concluida', 'cancelada');

create table public.doacao (
  id uuid primary key default gen_random_uuid(),
  anuncio_id uuid not null references public.anuncio (id) on delete cascade,
  doador_id uuid not null references public.perfil (id) on delete cascade,
  receptor_id uuid not null references public.perfil (id) on delete cascade,
  status public.status_doacao not null default 'combinando',
  pin text,
  aceito_em timestamptz,
  doador_confirmou_em timestamptz,
  receptor_confirmou_em timestamptz,
  concluida_em timestamptz,
  conta_para_recompensa boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint doacao_partes_diferentes check (doador_id <> receptor_id)
);

comment on column public.doacao.aceito_em is
  'Momento em que o doador aceitou. Antes disso o contato não é revelado.';

create index doacao_doador_idx on public.doacao (doador_id, status);
create index doacao_receptor_idx on public.doacao (receptor_id, status);
create index doacao_anuncio_idx on public.doacao (anuncio_id);

create unique index doacao_par_unico_idx
  on public.doacao (doador_id, receptor_id)
  where conta_para_recompensa;

create unique index doacao_pedido_aberto_idx
  on public.doacao (anuncio_id, receptor_id)
  where status = 'combinando';

create trigger doacao_atualizado_em
  before update on public.doacao
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------
-- RLS — escrita em `doacao` só via funções em `interno`
-- ---------------------------------------------------------------
alter table public.perfil enable row level security;
alter table public.filho enable row level security;
alter table public.anuncio enable row level security;
alter table public.procuro enable row level security;
alter table public.doacao enable row level security;

create policy "perfil: leitura própria"
  on public.perfil for select to authenticated
  using (id = (select auth.uid()));

create policy "perfil: atualização própria"
  on public.perfil for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "filho: gestão própria"
  on public.filho for all to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));

create policy "anuncio: feed visível para quem entrou"
  on public.anuncio for select to authenticated
  using (status <> 'removido');

create policy "anuncio: gestão do dono"
  on public.anuncio for insert to authenticated
  with check (perfil_id = (select auth.uid()));

create policy "anuncio: edição do dono"
  on public.anuncio for update to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));

create policy "procuro: gestão própria"
  on public.procuro for all to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));

create policy "doacao: visível para as duas partes"
  on public.doacao for select to authenticated
  using (
    doador_id = (select auth.uid())
    or receptor_id = (select auth.uid())
  );

-- ---------------------------------------------------------------
-- Storage das fotos do anúncio
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('anuncios', 'anuncios', true)
on conflict (id) do nothing;

create policy "anuncios: leitura pública"
  on storage.objects for select
  using (bucket_id = 'anuncios');

create policy "anuncios: upload do dono"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'anuncios'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "anuncios: troca do dono"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'anuncios'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'anuncios'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
