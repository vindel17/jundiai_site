-- Kits reservados fora do sistema. Entram só no contador público.
-- Não criam linha em reserva e não mudam lista, escola nem indicação.

create table public.reserva_ajuste (
  id bigint generated always as identity primary key,
  quantidade integer not null check (
    quantidade <> 0 and quantidade between -10000 and 10000
  ),
  nota text not null default '' check (char_length(nota) <= 200),
  autor text not null check (char_length(autor) between 1 and 200),
  criado_em timestamptz not null default now()
);

comment on table public.reserva_ajuste is
  'Lançamentos manuais do contador. Só cresce; uma correção é uma linha nova, com quantidade negativa.';
comment on column public.reserva_ajuste.quantidade is
  'Quanto somar no contador público. Negativo desfaz um lançamento anterior.';

create index reserva_ajuste_criado_idx
  on public.reserva_ajuste (criado_em desc);

alter table public.reserva_ajuste enable row level security;
revoke all on public.reserva_ajuste from public, anon, authenticated;
