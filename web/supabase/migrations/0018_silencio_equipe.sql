-- Quem assume e fica 2 horas sem responder perde a conversa para o bot
-- na próxima mensagem da família.

alter table public.atendimento_whatsapp
  add column assumido_em timestamptz;

update public.atendimento_whatsapp
  set assumido_em = aberto_em
  where atendente is not null and assumido_em is null;

create or replace function public.receber_mensagem_whatsapp(
  p_id text, p_wa_id text, p_texto text, p_pediu_atendente boolean, p_enviada_em timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atendimento uuid;
  v_atendente text;
  v_assumido timestamptz;
  v_desde timestamptz;
  v_novo boolean := false;
begin
  insert into public.agente_mensagem (id, wa_id)
    values (p_id, p_wa_id) on conflict (id) do nothing;
  if not found then return 'duplicada'; end if;
  if exists (select 1 from public.atendimento_mensagem where id = p_id) then
    return 'duplicada';
  end if;

  insert into public.agente_conversa as c (wa_id, ultima_entrada_em)
    values (p_wa_id, least(coalesce(p_enviada_em, now()), now()))
    on conflict (wa_id) do update
      set ultima_entrada_em = greatest(c.ultima_entrada_em, excluded.ultima_entrada_em);

  select a.id, a.atendente, a.assumido_em into v_atendimento, v_atendente, v_assumido
    from public.atendimento_whatsapp a
    where a.wa_id = p_wa_id and a.encerrado_em is null for update;

  if v_atendente is not null and not exists (
    select 1 from public.atendimento_mensagem
      where atendimento_id = v_atendimento and estado = 'enviando'
        and criado_em > now() - interval '1 minute'
  ) then
    select max(m.criado_em) into v_desde from public.atendimento_mensagem m
      where m.atendimento_id = v_atendimento
        and m.origem = 'equipe'
        and m.estado in ('aceita', 'incerta');
    if coalesce(v_desde, v_assumido) < now() - interval '2 hours' then
      update public.atendimento_whatsapp set encerrado_em = now() where id = v_atendimento;
      v_atendimento := null;
      v_atendente := null;
    end if;
  end if;

  if v_atendimento is null then
    if not p_pediu_atendente then return 'bot'; end if;
    insert into public.atendimento_whatsapp (wa_id) values (p_wa_id)
      returning id into v_atendimento;
    v_novo := true;
  end if;

  insert into public.atendimento_mensagem (id, atendimento_id, origem, texto, estado)
    values (p_id, v_atendimento, 'cliente', left(p_texto, 4096), 'recebida');
  return case
    when v_novo then 'novo'
    when v_atendente is null then 'fila'
    else 'humano'
  end;
end;
$$;

create or replace function public.mudar_atendimento_whatsapp(p_id uuid, p_autor text, p_encerrar boolean)
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
    update public.atendimento_whatsapp
      set atendente = p_autor, assumido_em = now()
      where id = p_id;
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
