create table public.atendimento_whatsapp (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null references public.agente_conversa(wa_id) on delete cascade,
  aberto_em timestamptz not null default now(),
  atendente text,
  encerrado_em timestamptz
);

create unique index atendimento_whatsapp_aberto_idx
  on public.atendimento_whatsapp (wa_id) where encerrado_em is null;
create index atendimento_whatsapp_fila_idx
  on public.atendimento_whatsapp (aberto_em, id) where encerrado_em is null;

create table public.atendimento_mensagem (
  id text primary key,
  atendimento_id uuid not null references public.atendimento_whatsapp(id) on delete cascade,
  origem text not null check (origem in ('cliente', 'equipe')),
  texto text not null check (char_length(texto) between 1 and 4096),
  estado text not null check (estado in ('recebida', 'enviando', 'aceita', 'recusada', 'incerta')),
  criado_em timestamptz not null default now()
);
create index atendimento_mensagem_historico_idx
  on public.atendimento_mensagem (atendimento_id, criado_em desc, id);

alter table public.atendimento_whatsapp enable row level security;
alter table public.atendimento_mensagem enable row level security;
revoke all on public.atendimento_whatsapp, public.atendimento_mensagem from public, anon, authenticated;
grant select on public.atendimento_whatsapp, public.atendimento_mensagem to service_role;
grant update (estado) on public.atendimento_mensagem to service_role;

create function public.receber_mensagem_whatsapp(
  p_id text, p_wa_id text, p_texto text, p_pediu_atendente boolean, p_enviada_em timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atendimento uuid;
  v_novo boolean := false;
begin
  insert into public.agente_mensagem (id, wa_id)
    values (p_id, p_wa_id) on conflict (id) do nothing;
  if not found then return 'duplicada'; end if;
  if exists (select 1 from public.atendimento_mensagem where id = p_id) then
    return 'duplicada';
  end if;

  -- Serializa as entradas do mesmo número e atualiza a janela de atendimento.
  insert into public.agente_conversa as c (wa_id, ultima_entrada_em)
    values (p_wa_id, least(coalesce(p_enviada_em, now()), now()))
    on conflict (wa_id) do update
      set ultima_entrada_em = greatest(c.ultima_entrada_em, excluded.ultima_entrada_em);

  select a.id into v_atendimento from public.atendimento_whatsapp a
    where a.wa_id = p_wa_id and a.encerrado_em is null for update;

  if v_atendimento is null then
    if not p_pediu_atendente then return 'bot'; end if;
    insert into public.atendimento_whatsapp (wa_id) values (p_wa_id)
      returning id into v_atendimento;
    v_novo := true;
  end if;

  insert into public.atendimento_mensagem (id, atendimento_id, origem, texto, estado)
    values (p_id, v_atendimento, 'cliente', left(p_texto, 4096), 'recebida');
  return case when v_novo then 'novo' else 'humano' end;
end;
$$;

create function public.mudar_atendimento_whatsapp(p_id uuid, p_autor text, p_encerrar boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atendimento public.atendimento_whatsapp%rowtype;
begin
  select * into v_atendimento from public.atendimento_whatsapp
    where id = p_id and encerrado_em is null for update;
  if not found then return false; end if;

  if not p_encerrar then
    if v_atendimento.atendente is not null then return false; end if;
    update public.atendimento_whatsapp set atendente = p_autor where id = p_id;
    return true;
  end if;

  if v_atendimento.atendente is distinct from p_autor or exists (
    select 1 from public.atendimento_mensagem
      where atendimento_id = p_id and estado = 'enviando'
        and criado_em > now() - interval '1 minute'
  ) then return false; end if;

  update public.atendimento_whatsapp set encerrado_em = now() where id = p_id;
  return true;
end;
$$;

create function public.preparar_resposta_whatsapp(p_id uuid, p_autor text, p_mensagem uuid, p_texto text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numero text;
begin
  select a.wa_id into v_numero from public.atendimento_whatsapp a
    join public.agente_conversa c on c.wa_id = a.wa_id
    where a.id = p_id and a.encerrado_em is null and a.atendente = p_autor
      and c.ultima_entrada_em > now() - interval '24 hours'
    for update of a;

  if not found or exists (
    select 1 from public.atendimento_mensagem
      where atendimento_id = p_id and estado = 'enviando'
        and criado_em > now() - interval '1 minute'
  ) then return null; end if;

  insert into public.atendimento_mensagem (id, atendimento_id, origem, texto, estado)
    values (p_mensagem::text, p_id, 'equipe', p_texto, 'enviando')
    on conflict (id) do nothing;
  if not found then return null; end if;
  return v_numero;
end;
$$;

revoke all on function public.receber_mensagem_whatsapp(text, text, text, boolean, timestamptz)
  from public, anon, authenticated;
revoke all on function public.mudar_atendimento_whatsapp(uuid, text, boolean)
  from public, anon, authenticated;
revoke all on function public.preparar_resposta_whatsapp(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.receber_mensagem_whatsapp(text, text, text, boolean, timestamptz)
  to service_role;
grant execute on function public.mudar_atendimento_whatsapp(uuid, text, boolean)
  to service_role;
grant execute on function public.preparar_resposta_whatsapp(uuid, text, uuid, text)
  to service_role;

create or replace function interno.limpar_agente_antigo()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.atendimento_whatsapp where encerrado_em < now() - interval '30 days';
  delete from public.agente_conversa c
    where c.atualizado_em < now() - interval '30 days'
      and not exists (
        select 1 from public.atendimento_whatsapp a where a.wa_id = c.wa_id
      );
  delete from public.agente_mensagem where recebido_em < now() - interval '7 days';
$$;
