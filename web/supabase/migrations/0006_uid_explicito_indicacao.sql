-- Fase 4 — canal WhatsApp: identidade como parâmetro (etiquetas / indicação)
-- Continuação de 0005. Mesmo padrão: corpo único em `interno`, porta do site
-- em `public.X(...)` e porta do agente em `public.X_como(p_uid, ...)`.

-- ---------------------------------------------------------------
-- Vínculo de indicação (o código chega por cookie no site, por texto no chat)
-- ---------------------------------------------------------------
drop function if exists interno.vincular_indicacao(text);

create function interno.vincular_indicacao(p_uid uuid, p_codigo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pendente boolean;
  v_padrinho uuid;
begin
  if p_uid is null then
    raise exception 'Entre para continuar.' using errcode = '28000';
  end if;

  select indicacao_pendente into v_pendente
    from public.perfil
   where id = p_uid
   for update;

  if v_pendente is null then
    return false;
  end if;

  -- Já tinha conta (ou já processamos o primeiro login): não atribui.
  if not v_pendente then
    return false;
  end if;

  update public.perfil
     set indicacao_pendente = false
   where id = p_uid;

  if coalesce(p_codigo, '') !~ '^[a-z0-9]{8}$' then
    return false;
  end if;

  select id into v_padrinho
    from public.perfil
   where codigo_indicacao = p_codigo
     and id <> p_uid;

  if v_padrinho is null then
    return false;
  end if;

  update public.perfil
     set indicado_por = v_padrinho,
         indicado_em = now()
   where id = p_uid
     and indicado_por is null;

  return true;
end;
$$;

create or replace function public.vincular_indicacao(p_codigo text)
returns boolean
language sql
security definer
set search_path = interno, public
as $$
  select interno.vincular_indicacao(auth.uid(), p_codigo);
$$;

revoke all on function public.vincular_indicacao(text) from public, anon;
grant execute on function public.vincular_indicacao(text) to authenticated;

create or replace function public.vincular_indicacao_como(p_uid uuid, p_codigo text)
returns boolean
language sql
security definer
set search_path = interno, public
as $$
  select interno.vincular_indicacao(p_uid, p_codigo);
$$;

revoke all on function public.vincular_indicacao_como(uuid, text)
  from public, anon, authenticated;
grant execute on function public.vincular_indicacao_como(uuid, text) to service_role;

-- ---------------------------------------------------------------
-- 1 etiqueta DTF ao completar perfil do aluno (só indicado)
-- ---------------------------------------------------------------
drop function if exists interno.liberar_etiqueta_boas_vindas();

create function interno.liberar_etiqueta_boas_vindas(p_uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dtf integer;
begin
  update public.perfil
     set etiquetas_boas_vindas = true,
         etiquetas_dtf = etiquetas_dtf + 1
   where id = p_uid
     and indicado_por is not null
     and not etiquetas_boas_vindas
     and exists (
       select 1 from public.filho f
        where f.perfil_id = p_uid
          and length(trim(f.nome)) >= 2
          and length(trim(f.escola)) >= 2
     )
  returning etiquetas_dtf into v_dtf;

  if v_dtf is null then
    select etiquetas_dtf into v_dtf from public.perfil where id = p_uid;
  end if;

  return coalesce(v_dtf, 0);
end;
$$;

create or replace function public.liberar_etiqueta_boas_vindas()
returns integer
language sql
security definer
set search_path = interno, public
as $$
  select interno.liberar_etiqueta_boas_vindas(auth.uid());
$$;

revoke all on function public.liberar_etiqueta_boas_vindas() from public, anon;
grant execute on function public.liberar_etiqueta_boas_vindas() to authenticated;

create or replace function public.liberar_etiqueta_boas_vindas_como(p_uid uuid)
returns integer
language sql
security definer
set search_path = interno, public
as $$
  select interno.liberar_etiqueta_boas_vindas(p_uid);
$$;

revoke all on function public.liberar_etiqueta_boas_vindas_como(uuid)
  from public, anon, authenticated;
grant execute on function public.liberar_etiqueta_boas_vindas_como(uuid) to service_role;

-- ---------------------------------------------------------------
-- Pedido vira compra (pendente 7 dias)
-- ---------------------------------------------------------------
drop function if exists interno.registrar_compra(integer);

create function interno.registrar_compra(p_uid uuid, p_valor_centavos integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_indicador uuid;
  v_id uuid;
begin
  if p_uid is null then
    raise exception 'Entre para somar no placar.' using errcode = '28000';
  end if;

  if p_valor_centavos is null or p_valor_centavos < 100 then
    raise exception 'Valor inválido.' using errcode = '22023';
  end if;

  select indicado_por into v_indicador
    from public.perfil
   where id = p_uid;

  insert into public.compra (perfil_id, valor_centavos, indicador_id)
  values (p_uid, p_valor_centavos, v_indicador)
  returning id into v_id;

  -- 1ª compra pelo fluxo do link: completa até 5 etiquetas (por conta)
  update public.perfil
     set etiquetas_primeira_compra = true,
         etiquetas_dtf = 5
   where id = p_uid
     and indicado_por is not null
     and not etiquetas_primeira_compra;

  return v_id;
end;
$$;

create or replace function public.registrar_compra(p_valor_centavos integer)
returns uuid
language sql
security definer
set search_path = interno, public
as $$
  select interno.registrar_compra(auth.uid(), p_valor_centavos);
$$;

revoke all on function public.registrar_compra(integer) from public, anon;
grant execute on function public.registrar_compra(integer) to authenticated;

create or replace function public.registrar_compra_como(
  p_uid uuid,
  p_valor_centavos integer
)
returns uuid
language sql
security definer
set search_path = interno, public
as $$
  select interno.registrar_compra(p_uid, p_valor_centavos);
$$;

revoke all on function public.registrar_compra_como(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.registrar_compra_como(uuid, integer) to service_role;

-- ---------------------------------------------------------------
-- Placar R$ 350 repetível
-- ---------------------------------------------------------------
drop function if exists interno.placar_indicacao();

create function interno.placar_indicacao(p_uid uuid)
returns table (
  codigo text,
  acessos int,
  cadastros int,
  pendente_centavos int,
  confirmado_centavos int,
  camisetas int,
  faltam_centavos int,
  etiquetas_dtf int,
  indicado boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmado int;
  v_resgatadas int;
begin
  perform interno.confirmar_compras_vencidas();

  select
    p.codigo_indicacao,
    p.indicacao_acessos,
    (select count(*)::int from public.perfil x where x.indicado_por = p.id),
    coalesce((
      select sum(c.valor_centavos)::int
        from public.compra c
       where c.indicador_id = p.id and c.status = 'pendente'
    ), 0),
    coalesce((
      select sum(c.valor_centavos)::int
        from public.compra c
       where c.indicador_id = p.id and c.status = 'confirmada'
    ), 0),
    p.etiquetas_dtf,
    p.indicado_por is not null
  into codigo, acessos, cadastros, pendente_centavos, confirmado_centavos, etiquetas_dtf, indicado
  from public.perfil p
  where p.id = p_uid;

  v_confirmado := coalesce(confirmado_centavos, 0);

  select count(*)::int into v_resgatadas
    from public.resgate r
   where r.perfil_id = p_uid
     and r.status <> 'cancelado';

  camisetas := greatest(0, (v_confirmado / 35000) - coalesce(v_resgatadas, 0));
  faltam_centavos := 35000 - (v_confirmado % 35000);
  if faltam_centavos = 35000 and v_confirmado > 0 and camisetas > 0 then
    faltam_centavos := 35000;
  end if;

  return next;
end;
$$;

create or replace function public.placar_indicacao()
returns table (
  codigo text,
  acessos int,
  cadastros int,
  pendente_centavos int,
  confirmado_centavos int,
  camisetas int,
  faltam_centavos int,
  etiquetas_dtf int,
  indicado boolean
)
language sql
security definer
set search_path = interno, public
as $$
  select * from interno.placar_indicacao(auth.uid());
$$;

revoke all on function public.placar_indicacao() from public, anon;
grant execute on function public.placar_indicacao() to authenticated;

create or replace function public.placar_indicacao_como(p_uid uuid)
returns table (
  codigo text,
  acessos int,
  cadastros int,
  pendente_centavos int,
  confirmado_centavos int,
  camisetas int,
  faltam_centavos int,
  etiquetas_dtf int,
  indicado boolean
)
language sql
security definer
set search_path = interno, public
as $$
  select * from interno.placar_indicacao(p_uid);
$$;

revoke all on function public.placar_indicacao_como(uuid)
  from public, anon, authenticated;
grant execute on function public.placar_indicacao_como(uuid) to service_role;

-- ---------------------------------------------------------------
-- Pedir resgate (1 camiseta, entrega em casa)
-- ---------------------------------------------------------------
drop function if exists interno.pedir_resgate(text);

create function interno.pedir_resgate(p_uid uuid, p_endereco text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmado int;
  v_resgatadas int;
  v_id uuid;
  v_end text := trim(p_endereco);
begin
  if p_uid is null then
    raise exception 'Entre para pedir o resgate.' using errcode = '28000';
  end if;

  if length(v_end) < 10 then
    raise exception 'Informe o endereço completo para a entrega.' using errcode = '22023';
  end if;

  perform interno.confirmar_compras_vencidas();

  select coalesce(sum(valor_centavos), 0)::int into v_confirmado
    from public.compra
   where indicador_id = p_uid and status = 'confirmada';

  select count(*)::int into v_resgatadas
    from public.resgate
   where perfil_id = p_uid and status <> 'cancelado';

  if (v_confirmado / 35000) - v_resgatadas < 1 then
    raise exception 'Ainda não há camiseta para resgatar.' using errcode = 'P0001';
  end if;

  insert into public.resgate (perfil_id, endereco)
  values (p_uid, v_end)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.pedir_resgate(p_endereco text)
returns uuid
language sql
security definer
set search_path = interno, public
as $$
  select interno.pedir_resgate(auth.uid(), p_endereco);
$$;

revoke all on function public.pedir_resgate(text) from public, anon;
grant execute on function public.pedir_resgate(text) to authenticated;

create or replace function public.pedir_resgate_como(p_uid uuid, p_endereco text)
returns uuid
language sql
security definer
set search_path = interno, public
as $$
  select interno.pedir_resgate(p_uid, p_endereco);
$$;

revoke all on function public.pedir_resgate_como(uuid, text)
  from public, anon, authenticated;
grant execute on function public.pedir_resgate_como(uuid, text) to service_role;
