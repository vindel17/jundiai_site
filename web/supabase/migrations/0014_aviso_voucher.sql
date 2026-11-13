-- Aviso da liberação do voucher de 2027. Uma mensagem por WhatsApp.
alter table public.reserva_aviso
  alter column reserva_id drop not null,
  drop constraint reserva_aviso_tipo_chk,
  drop constraint reserva_aviso_situacao_chk,
  add constraint reserva_aviso_tipo_chk check (
    (tipo = 'kit_pronto' and reserva_id is not null)
    or (tipo = 'voucher_liberado' and reserva_id is null)
  ),
  add constraint reserva_aviso_situacao_chk check (
    situacao in ('pendente', 'processando', 'enviado', 'entregue', 'descartado', 'erro', 'incerto')
  ),
  add column whatsapp_id text;

create unique index reserva_aviso_voucher_familia_idx
  on public.reserva_aviso (telefone) where tipo = 'voucher_liberado';

create unique index reserva_aviso_whatsapp_id_idx
  on public.reserva_aviso (whatsapp_id) where whatsapp_id is not null;

create table public.reserva_aviso_preferencia (
  telefone text primary key,
  destino text not null,
  aceita boolean not null,
  canal text not null check (canal in ('site', 'whatsapp')),
  registrado_em timestamptz not null
);

alter table public.reserva_aviso_preferencia enable row level security;
revoke all on public.reserva_aviso_preferencia from anon, authenticated;
grant select on public.reserva_aviso_preferencia to service_role;

-- As duas formas brasileiras, com e sem nono dígito, pertencem à mesma família.
create function interno.telefone_aviso_voucher(p_telefone text)
returns text
language sql immutable strict
set search_path = ''
as $$
  select case
    when p_telefone ~ '^55[0-9]{2}9[0-9]{8}$' then p_telefone
    when p_telefone ~ '^55[0-9]{10}$' then left(p_telefone, 4) || '9' || right(p_telefone, 8)
  end;
$$;

create view interno.familias_aviso_voucher as
  select distinct interno.telefone_aviso_voucher(r.telefone) as telefone
    from public.reserva r
   where r.status <> 'cancelada'
     and interno.telefone_aviso_voucher(r.telefone) is not null;

create function public.preferir_aviso_voucher(
  p_destino text, p_aceita boolean, p_canal text, p_registrado_em timestamptz
)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_telefone text := interno.telefone_aviso_voucher(p_destino);
  v_aceita boolean;
begin
  insert into public.reserva_aviso_preferencia as preferencia
    (telefone, destino, aceita, canal, registrado_em)
  values (v_telefone, p_destino, p_aceita, p_canal, least(p_registrado_em, now()))
  on conflict (telefone) do update
    set destino = excluded.destino, aceita = excluded.aceita,
        canal = excluded.canal, registrado_em = excluded.registrado_em
    where excluded.registrado_em > preferencia.registrado_em
       or (excluded.registrado_em = preferencia.registrado_em and not excluded.aceita);

  select aceita into v_aceita
    from public.reserva_aviso_preferencia where telefone = v_telefone;
  return v_aceita;
end;
$$;

create function public.resumo_aviso_voucher()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  with familias as (
    select f.telefone, p.aceita, a.id, a.situacao, a.whatsapp_id
      from interno.familias_aviso_voucher f
      left join public.reserva_aviso_preferencia p using (telefone)
      left join public.reserva_aviso a on a.telefone = f.telefone and a.tipo = 'voucher_liberado'
  ), fila as (
    select situacao, resolvido_em
      from public.reserva_aviso
     where tipo = 'voucher_liberado'
  )
  select jsonb_build_object(
    'familias', (select count(*) from familias),
    'sem_aceite', (select count(*) from familias where aceita is distinct from true),
    'a_preparar', (select count(*) from familias where aceita and id is null),
    'pendentes', (select count(*) from familias where aceita and situacao = 'pendente'),
    'recusados', (select count(*) from familias where aceita and situacao = 'erro' and whatsapp_id is null),
    'enviados', count(*) filter (where situacao = 'enviado'),
    'entregues', count(*) filter (where situacao = 'entregue'),
    'falhas', count(*) filter (where situacao = 'erro'),
    'em_envio', count(*) filter (where situacao = 'processando' and resolvido_em > now() - interval '1 minute'),
    'incertos', count(*) filter (where situacao = 'incerto'
      or (situacao = 'processando' and resolvido_em <= now() - interval '1 minute'))
  ) from fila;
$$;

create function public.recolocar_aviso_voucher(p_autor text)
returns integer
language sql security definer
set search_path = ''
as $$
  with recolocados as (
    update public.reserva_aviso a
       set situacao = 'pendente', erro = '', resolvido_em = null, autor = p_autor
      from interno.familias_aviso_voucher f
      join public.reserva_aviso_preferencia p using (telefone)
     where a.telefone = f.telefone and p.aceita
       and a.tipo = 'voucher_liberado' and a.situacao = 'erro' and a.whatsapp_id is null
     returning a.id
  )
  select count(*)::integer from recolocados;
$$;

create function public.preparar_aviso_voucher(p_autor text, p_quantidade integer)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_inseridos integer;
begin
  -- Serializa a confirmação para que duas abas não preparem públicos distintos.
  perform pg_advisory_xact_lock(140014);
  with candidatas as (
    select f.telefone
      from interno.familias_aviso_voucher f
      join public.reserva_aviso_preferencia p using (telefone)
     where p.aceita and not exists (
       select 1 from public.reserva_aviso a
        where a.tipo = 'voucher_liberado' and a.telefone = f.telefone
     )
  )
  insert into public.reserva_aviso (telefone, tipo, autor)
  select telefone, 'voucher_liberado', p_autor from candidatas
   where (select count(*) from candidatas) = p_quantidade;

  get diagnostics v_inseridos = row_count;
  return v_inseridos;
end;
$$;

create function public.proximo_lote_aviso_voucher()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select a.id
    from public.reserva_aviso a
    join interno.familias_aviso_voucher f using (telefone)
    join public.reserva_aviso_preferencia p using (telefone)
   where a.tipo = 'voucher_liberado' and a.situacao = 'pendente' and p.aceita
   order by a.criado_em, a.id
   limit 40;
$$;

create function public.assumir_aviso_voucher(p_autor text, p_ids uuid[])
returns table (id uuid, destino text)
language sql security definer
set search_path = ''
as $$
  with candidatas as (
    select a.id, p.destino
      from public.reserva_aviso a
      join interno.familias_aviso_voucher f using (telefone)
      join public.reserva_aviso_preferencia p using (telefone)
     where a.id = any (p_ids)
       and a.tipo = 'voucher_liberado' and a.situacao = 'pendente' and p.aceita
     order by a.criado_em, a.id
     limit 8
       for update of a skip locked
  )
  update public.reserva_aviso a
     set situacao = 'processando', autor = p_autor, resolvido_em = now()
    from candidatas c where a.id = c.id
  returning a.id, c.destino;
$$;

-- Eventos podem chegar repetidos ou antes de a resposta HTTP ser gravada.
create function public.atualizar_aviso_voucher(
  p_id uuid, p_whatsapp_id text, p_situacao text, p_erro text
)
returns void
language sql security definer
set search_path = ''
as $$
  update public.reserva_aviso a
     set situacao = p_situacao,
         whatsapp_id = coalesce(a.whatsapp_id, nullif(p_whatsapp_id, '')),
         erro = left(coalesce(p_erro, ''), 80),
         resolvido_em = now()
   where a.tipo = 'voucher_liberado'
     and (a.id = p_id or (p_id is null and a.whatsapp_id = nullif(p_whatsapp_id, '')))
     and (a.whatsapp_id is null or a.whatsapp_id = p_whatsapp_id)
     and (
       (a.situacao = 'processando' and p_situacao in ('incerto', 'erro'))
       or (a.situacao in ('processando', 'incerto') and p_situacao = 'enviado' and p_whatsapp_id <> '')
       or (a.situacao in ('processando', 'incerto', 'enviado') and p_situacao = 'erro' and p_whatsapp_id <> '')
       or (a.situacao in ('processando', 'incerto', 'enviado', 'erro') and p_situacao = 'entregue' and p_whatsapp_id <> '')
     );
$$;

revoke all on function public.preferir_aviso_voucher(text, boolean, text, timestamptz),
  public.resumo_aviso_voucher(), public.preparar_aviso_voucher(text, integer),
  public.recolocar_aviso_voucher(text),
  public.proximo_lote_aviso_voucher(), public.assumir_aviso_voucher(text, uuid[]),
  public.atualizar_aviso_voucher(uuid, text, text, text)
  from public, anon, authenticated;

grant execute on function public.preferir_aviso_voucher(text, boolean, text, timestamptz),
  public.resumo_aviso_voucher(), public.preparar_aviso_voucher(text, integer),
  public.recolocar_aviso_voucher(text),
  public.proximo_lote_aviso_voucher(), public.assumir_aviso_voucher(text, uuid[]),
  public.atualizar_aviso_voucher(uuid, text, text, text)
  to service_role;
