-- Diz se a conversa acabou de entrar na fila, para avisar a equipe uma vez só.

drop function public.abrir_fila_whatsapp(text, text, text);

create function public.abrir_fila_whatsapp(p_wa_id text, p_id text, p_texto text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_novo boolean := false;
begin
  select a.id into v_id from public.atendimento_whatsapp a
    where a.wa_id = p_wa_id and a.encerrado_em is null
    for update;

  if v_id is null then
    insert into public.atendimento_whatsapp (wa_id) values (p_wa_id)
      returning id into v_id;
    v_novo := true;
  end if;

  insert into public.atendimento_mensagem (id, atendimento_id, origem, texto, estado)
  values (p_id, v_id, 'cliente', left(p_texto, 4096), 'recebida')
  on conflict (id) do nothing;
  return case when v_novo then 'novo' else 'aberta' end;
end;
$$;

revoke all on function public.abrir_fila_whatsapp(text, text, text) from public, anon, authenticated;
grant execute on function public.abrir_fila_whatsapp(text, text, text) to service_role;
