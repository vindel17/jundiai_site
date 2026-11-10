-- Funil de acesso e reserva: uma linha por pessoa e etapa, sem repetir.
-- A pessoa vira um código irreversível (HMAC) antes de chegar aqui; telefone
-- e cookie nunca ficam nesta tabela.
-- Só o service_role lê e grava. A tela /equipe/metricas passa por essa chave
-- depois de conferir que a conta é da administração.

create table if not exists public.metrica_evento (
  id bigint generated always as identity primary key,
  canal text not null,
  etapa text not null,
  pessoa text not null,
  origem_canal text not null default 'direto',
  origem_codigo text not null default '',
  criado_em timestamptz not null default now(),
  constraint metrica_canal_chk check (canal in ('whatsapp', 'site')),
  constraint metrica_etapa_chk check (
    etapa in (
      'contato', 'reserva_iniciada', 'escola', 'kit', 'resumo', 'confirmada',
      'visita_site', 'visita_reserva', 'clique_whatsapp'
    )
  ),
  constraint metrica_origem_chk check (
    origem_canal in ('panfleto', 'social', 'pago', 'indicacao', 'direto')
  ),
  constraint metrica_pessoa_etapa_uq unique (canal, etapa, pessoa)
);

comment on table public.metrica_evento is
  'Primeira vez que cada pessoa chegou a cada etapa. Só cresce; nunca se edita.';
comment on column public.metrica_evento.pessoa is
  'HMAC do telefone (WhatsApp) ou do cookie anônimo (site). Não reverte ao original.';
comment on column public.metrica_evento.origem_canal is
  'Origem conhecida no momento da etapa. Mesmos valores da reserva.';

create index if not exists metrica_evento_criado_idx
  on public.metrica_evento (criado_em desc);

alter table public.metrica_evento enable row level security;

-- Contagem pronta para a tela: o banco soma, o site só lê o resultado.
create or replace function public.metrica_funil(p_desde timestamptz default null)
returns table (canal text, etapa text, origem_canal text, pessoas bigint)
language sql
stable
set search_path = public
as $$
  select e.canal, e.etapa, e.origem_canal, count(*) as pessoas
    from public.metrica_evento e
   where p_desde is null or e.criado_em >= p_desde
   group by e.canal, e.etapa, e.origem_canal;
$$;

comment on function public.metrica_funil(timestamptz) is
  'Pessoas distintas por canal, etapa e origem desde a data pedida (ou desde sempre).';

revoke all on function public.metrica_funil(timestamptz) from public, anon, authenticated;
grant execute on function public.metrica_funil(timestamptz) to service_role;
