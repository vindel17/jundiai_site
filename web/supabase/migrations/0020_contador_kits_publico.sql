-- O site lê só este inteiro, com a chave pública. A tabela continua fechada.

create or replace function public.contador_kits_publico()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    (select count(*)::integer from public.reserva)
    + coalesce((select sum(quantidade)::integer from public.reserva_ajuste), 0)
  );
$$;

comment on function public.contador_kits_publico() is
  'Total do contador: todas as reservas, inclusive canceladas, mais os lançamentos manuais.';

revoke all on function public.contador_kits_publico() from public;
grant execute on function public.contador_kits_publico() to anon, authenticated;
