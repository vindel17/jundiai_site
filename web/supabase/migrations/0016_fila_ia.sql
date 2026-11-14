-- Fila sem dono continua com a IA respondendo. A equipe vê o que a IA disse
-- e pode encaminhar a conversa de volta para a IA sem assumir antes.

alter table public.atendimento_mensagem
  drop constraint atendimento_mensagem_origem_check,
  add constraint atendimento_mensagem_origem_check
    check (origem in ('cliente', 'equipe', 'bot'));

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

  select a.id, a.atendente into v_atendimento, v_atendente from public.atendimento_whatsapp a
    where a.wa_id = p_wa_id and a.encerrado_em is null for update;

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

create function public.registrar_resposta_bot(p_wa_id text, p_id text, p_texto text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.atendimento_mensagem (id, atendimento_id, origem, texto, estado)
  select p_id, a.id, 'bot', left(p_texto, 4096), 'aceita'
    from public.atendimento_whatsapp a
   where a.wa_id = p_wa_id and a.encerrado_em is null
  on conflict (id) do nothing;
$$;

-- Fecha a fila e devolve a última mensagem da família, se ela for a última da conversa.
create function public.encaminhar_atendimento_ia(p_id uuid, p_autor text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_atendimento public.atendimento_whatsapp%rowtype;
  v_origem text;
  v_texto text;
  v_janela boolean;
begin
  select * into v_atendimento from public.atendimento_whatsapp
    where id = p_id and encerrado_em is null for update;
  if not found then return null; end if;
  if v_atendimento.atendente is not null and v_atendimento.atendente <> p_autor then
    return null;
  end if;
  if exists (
    select 1 from public.atendimento_mensagem
      where atendimento_id = p_id and estado = 'enviando'
        and criado_em > now() - interval '1 minute'
  ) then return null; end if;

  update public.atendimento_whatsapp
     set encerrado_em = now(), atendente = coalesce(atendente, p_autor)
   where id = p_id;

  select m.origem, m.texto into v_origem, v_texto from public.atendimento_mensagem m
    where m.atendimento_id = p_id
    order by m.criado_em desc, m.id desc
    limit 1;
  select c.ultima_entrada_em > now() - interval '24 hours' into v_janela
    from public.agente_conversa c where c.wa_id = v_atendimento.wa_id;

  return jsonb_build_object(
    'wa_id', v_atendimento.wa_id,
    'texto', case when v_origem = 'cliente' then v_texto end,
    'na_janela', coalesce(v_janela, false)
  );
end;
$$;

revoke all on function public.registrar_resposta_bot(text, text, text) from public, anon, authenticated;
revoke all on function public.encaminhar_atendimento_ia(uuid, text) from public, anon, authenticated;
grant execute on function public.registrar_resposta_bot(text, text, text) to service_role;
grant execute on function public.encaminhar_atendimento_ia(uuid, text) to service_role;
