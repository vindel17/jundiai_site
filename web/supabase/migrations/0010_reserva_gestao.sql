-- Gestão das reservas pela equipe: status, histórico e fila de avisos.
-- Pagamento e entrega entram depois, como novos status, sem mudar esta base.
--
-- As regras de transição abaixo têm espelho em src/lib/reserva/status.ts,
-- que decide quais botões a tela mostra. O banco é quem garante.
--
-- Só o service_role lê e grava, como em 0008.

-- ---------------------------------------------------------------
-- Status da reserva
-- ---------------------------------------------------------------
alter table public.reserva
  drop constraint if exists reserva_status_chk,
  add constraint reserva_status_chk check (
    status in ('recebida', 'aceita', 'em_producao', 'kit_pronto', 'cancelada')
  );

comment on column public.reserva.status is
  'recebida → aceita → em_producao → kit_pronto. Cancelada em qualquer ponto. '
  'Tamanho só muda em recebida ou aceita.';

create index if not exists reserva_status_idx
  on public.reserva (status, criado_em desc);

-- Tamanho travado a partir da produção, venha a mudança da tela ou do WhatsApp.
create or replace function interno.travar_tamanho_reserva()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status not in ('recebida', 'aceita')
     and (new.tamanho_curta, new.tamanho_longa, new.tamanho_inferior,
          new.tamanho_calca, new.tamanho_blusa)
         is distinct from
         (old.tamanho_curta, old.tamanho_longa, old.tamanho_inferior,
          old.tamanho_calca, old.tamanho_blusa)
  then
    raise exception 'reserva_tamanho_travado'
      using hint = 'A reserva já entrou em produção.';
  end if;
  return new;
end;
$$;

drop trigger if exists reserva_travar_tamanho on public.reserva;
create trigger reserva_travar_tamanho
  before update on public.reserva
  for each row execute function interno.travar_tamanho_reserva();

-- ---------------------------------------------------------------
-- reserva_evento — quem mudou o status, quando e por quê
-- ---------------------------------------------------------------
create table if not exists public.reserva_evento (
  id bigint generated always as identity primary key,
  reserva_id uuid not null references public.reserva (id) on delete cascade,
  status_de text,
  status_para text not null,
  autor text not null,
  observacao text not null default '',
  criado_em timestamptz not null default now()
);

comment on table public.reserva_evento is
  'Histórico de status. Só cresce; nunca se edita uma linha.';
comment on column public.reserva_evento.autor is
  'Telefone ou e-mail da pessoa da equipe, ou "sistema".';

create index if not exists reserva_evento_reserva_idx
  on public.reserva_evento (reserva_id, criado_em desc);

alter table public.reserva_evento enable row level security;

-- ---------------------------------------------------------------
-- reserva_aviso — mensagem à família esperando a equipe confirmar
-- ---------------------------------------------------------------
create table if not exists public.reserva_aviso (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reserva (id) on delete cascade,
  telefone text not null,
  tipo text not null,
  situacao text not null default 'pendente',
  autor text not null default '',
  erro text not null default '',
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz,
  constraint reserva_aviso_tipo_chk check (tipo in ('kit_pronto')),
  constraint reserva_aviso_situacao_chk check (
    situacao in ('pendente', 'enviado', 'descartado', 'erro')
  )
);

comment on table public.reserva_aviso is
  'Fila de WhatsApp para a família. Nada sai sem a equipe confirmar.';
comment on column public.reserva_aviso.autor is
  'Quem enviou ou descartou. Vazio enquanto pendente.';

create unique index if not exists reserva_aviso_pendente_idx
  on public.reserva_aviso (reserva_id, tipo)
  where situacao = 'pendente';
create index if not exists reserva_aviso_situacao_idx
  on public.reserva_aviso (situacao, criado_em);

alter table public.reserva_aviso enable row level security;

-- ---------------------------------------------------------------
-- Mudança de status em lote, com histórico e aviso na mesma transação
-- ---------------------------------------------------------------
create or replace function public.mudar_status_reserva(
  p_ids uuid[],
  p_para text,
  p_autor text,
  p_observacao text default ''
)
returns table (id uuid, status_anterior text, mudou boolean)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
begin
  if coalesce(trim(p_autor), '') = '' then
    raise exception 'reserva_autor_obrigatorio';
  end if;

  return query
  with permitidas (de, para) as (
    values
      ('recebida', 'aceita'),
      ('aceita', 'recebida'),
      ('aceita', 'em_producao'),
      ('em_producao', 'aceita'),
      ('em_producao', 'kit_pronto'),
      ('kit_pronto', 'em_producao'),
      ('recebida', 'cancelada'),
      ('aceita', 'cancelada'),
      ('em_producao', 'cancelada'),
      ('kit_pronto', 'cancelada'),
      ('cancelada', 'recebida')
  ),
  alvo as (
    select r.id, r.status, r.telefone
      from public.reserva r
     where r.id = any (p_ids)
       for update
  ),
  mudadas as (
    update public.reserva r
       set status = p_para
      from alvo a
      join permitidas p on p.de = a.status and p.para = p_para
     where r.id = a.id
    returning r.id, a.status as de, a.telefone
  ),
  eventos as (
    insert into public.reserva_evento (reserva_id, status_de, status_para, autor, observacao)
    select m.id, m.de, p_para, p_autor, coalesce(p_observacao, '')
      from mudadas m
  ),
  avisos as (
    insert into public.reserva_aviso (reserva_id, telefone, tipo)
    select m.id, m.telefone, 'kit_pronto'
      from mudadas m
     where p_para = 'kit_pronto'
    on conflict (reserva_id, tipo) where situacao = 'pendente' do nothing
  ),
  descartados as (
    update public.reserva_aviso v
       set situacao = 'descartado', autor = p_autor, resolvido_em = now()
      from mudadas m
     where v.reserva_id = m.id
       and v.situacao = 'pendente'
       and m.de = 'kit_pronto'
  )
  select a.id, a.status, m.id is not null
    from alvo a
    left join mudadas m on m.id = a.id;
end;
$$;

comment on function public.mudar_status_reserva(uuid[], text, text, text) is
  'Muda o status das reservas permitidas, grava o histórico e enfileira o aviso '
  'de kit pronto. Quem não pode ir para o status pedido volta com mudou = false; '
  'id fora da tabela não volta.';

revoke all on function public.mudar_status_reserva(uuid[], text, text, text)
  from public, anon, authenticated;
grant execute on function public.mudar_status_reserva(uuid[], text, text, text)
  to service_role;
