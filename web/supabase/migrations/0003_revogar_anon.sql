-- Default privileges no Supabase também concedem EXECUTE a `anon`.
-- Revoga as RPCs privilegiadas; só `contar_anuncios_ativos` fica pública.

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

revoke all on function public.pedir_peca(uuid) from public, anon;
revoke all on function public.responder_pedido(uuid, boolean) from public, anon;
revoke all on function public.contato_da_doacao(uuid) from public, anon;
revoke all on function public.confirmar_entrega(uuid) from public, anon;
revoke all on function public.placar_doacao() from public, anon;

grant execute on function public.pedir_peca(uuid) to authenticated;
grant execute on function public.responder_pedido(uuid, boolean) to authenticated;
grant execute on function public.contato_da_doacao(uuid) to authenticated;
grant execute on function public.confirmar_entrega(uuid) to authenticated;
grant execute on function public.placar_doacao() to authenticated;
