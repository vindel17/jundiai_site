-- rls_auto_enable é um gatilho interno do Supabase: liga a proteção de linha
-- quando uma tabela é criada. Não faz parte do site, mas nascia com EXECUTE
-- para qualquer visitante, pela API. O gatilho continua: quem cria tabela
-- (postgres) ainda pode executá-la.

do $$
begin
  if exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'rls_auto_enable'
  ) then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
