-- Fase 3 — indicação por link
-- Regras cravadas na conversa de ago/2026 (cookie 30d, confirmação 7d,
-- faixa R$ 350 repetível, vínculo só no cadastro, 1+4 etiquetas DTF).

-- ---------------------------------------------------------------
-- perfil: código, padrinho, etiquetas
-- ---------------------------------------------------------------
alter table public.perfil
  add column if not exists codigo_indicacao text,
  add column if not exists indicado_por uuid references public.perfil (id),
  add column if not exists indicado_em timestamptz,
  add column if not exists indicacao_pendente boolean not null default true,
  add column if not exists indicacao_acessos integer not null default 0,
  add column if not exists etiquetas_dtf smallint not null default 0,
  add column if not exists etiquetas_boas_vindas boolean not null default false,
  add column if not exists etiquetas_primeira_compra boolean not null default false;

alter table public.perfil
  drop constraint if exists perfil_nao_auto_indicacao;
alter table public.perfil
  add constraint perfil_nao_auto_indicacao
  check (indicado_por is distinct from id);

create unique index if not exists perfil_codigo_indicacao_idx
  on public.perfil (codigo_indicacao);
create index if not exists perfil_indicado_por_idx
  on public.perfil (indicado_por);

-- Contas que já existiam não podem ser “pegas” por um link futuro
update public.perfil
   set indicacao_pendente = false
 where indicacao_pendente
   and criado_em < now() - interval '1 hour';

-- O usuário só pode mudar o próprio nome. Código e padrinho são do sistema.
revoke update on public.perfil from authenticated;
grant update (nome_responsavel) on public.perfil to authenticated;

create or replace function interno.novo_codigo_indicacao()
returns text
language plpgsql
set search_path = public
as $$
declare
  c text;
  n int := 0;
begin
  loop
    c := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
    exit when not exists (select 1 from public.perfil where codigo_indicacao = c);
    n := n + 1;
    if n > 10 then
      raise exception 'Não gerou código de indicação.';
    end if;
  end loop;
  return c;
end;
$$;

create or replace function interno.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, telefone, codigo_indicacao)
  values (new.id, coalesce(new.phone, ''), interno.novo_codigo_indicacao())
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.perfil
   set codigo_indicacao = interno.novo_codigo_indicacao()
 where codigo_indicacao is null;

-- ---------------------------------------------------------------
-- compra atribuída ao indicador
-- ---------------------------------------------------------------
do $$ begin
  create type public.status_compra as enum ('pendente', 'confirmada', 'cancelada');
exception when duplicate_object then null;
end $$;

create table if not exists public.compra (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  valor_centavos integer not null check (valor_centavos > 0),
  status public.status_compra not null default 'pendente',
  indicador_id uuid references public.perfil (id),
  confirmada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists compra_perfil_id_idx on public.compra (perfil_id);
create index if not exists compra_indicador_idx on public.compra (indicador_id, status);

create trigger compra_atualizado_em
  before update on public.compra
  for each row execute function public.tocar_atualizado_em();

alter table public.compra enable row level security;

drop policy if exists "compra: dono e indicador leem" on public.compra;
create policy "compra: dono e indicador leem"
  on public.compra for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or indicador_id = (select auth.uid())
  );

-- ---------------------------------------------------------------
-- resgate da camiseta (entrega em domicílio)
-- ---------------------------------------------------------------
do $$ begin
  create type public.status_resgate as enum ('pedido', 'enviado', 'cancelado');
exception when duplicate_object then null;
end $$;

create table if not exists public.resgate (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfil (id) on delete cascade,
  pecas smallint not null default 1 check (pecas = 1),
  endereco text not null,
  status public.status_resgate not null default 'pedido',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists resgate_perfil_id_idx on public.resgate (perfil_id, status);

create trigger resgate_atualizado_em
  before update on public.resgate
  for each row execute function public.tocar_atualizado_em();

alter table public.resgate enable row level security;

drop policy if exists "resgate: leitura própria" on public.resgate;
create policy "resgate: leitura própria"
  on public.resgate for select to authenticated
  using (perfil_id = (select auth.uid()));

-- ---------------------------------------------------------------
-- Confirma compras com mais de 7 dias (prazo de arrependimento)
-- ---------------------------------------------------------------
create or replace function interno.confirmar_compras_vencidas()
returns void
language sql
security definer
set search_path = public
as $$
  update public.compra
     set status = 'confirmada',
         confirmada_em = coalesce(confirmada_em, now())
   where status = 'pendente'
     and criado_em <= now() - interval '7 days';
$$;

-- ---------------------------------------------------------------
-- Clique no link (anônimo pode contar)
-- ---------------------------------------------------------------
create or replace function interno.registrar_acesso_indicacao(p_codigo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_codigo is null or p_codigo !~ '^[a-z0-9]{8}$' then
    return;
  end if;

  select id into v_id
    from public.perfil
   where codigo_indicacao = p_codigo;

  if v_id is null then
    return;
  end if;

  if auth.uid() is not null and auth.uid() = v_id then
    return;
  end if;

  update public.perfil
     set indicacao_acessos = indicacao_acessos + 1
   where id = v_id;
end;
$$;

create or replace function public.registrar_acesso_indicacao(p_codigo text)
returns void
language sql
security definer
set search_path = interno, public
as $$
  select interno.registrar_acesso_indicacao(p_codigo);
$$;

revoke all on function public.registrar_acesso_indicacao(text) from public, anon, authenticated;
grant execute on function public.registrar_acesso_indicacao(text) to anon, authenticated;

-- ---------------------------------------------------------------
-- Vínculo só na criação da conta (cookie 30d vive no app)
-- ---------------------------------------------------------------
create or replace function interno.vincular_indicacao(p_codigo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pendente boolean;
  v_padrinho uuid;
begin
  if v_uid is null then
    raise exception 'Entre para continuar.' using errcode = '28000';
  end if;

  select indicacao_pendente into v_pendente
    from public.perfil
   where id = v_uid
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
   where id = v_uid;

  if coalesce(p_codigo, '') !~ '^[a-z0-9]{8}$' then
    return false;
  end if;

  select id into v_padrinho
    from public.perfil
   where codigo_indicacao = p_codigo
     and id <> v_uid;

  if v_padrinho is null then
    return false;
  end if;

  update public.perfil
     set indicado_por = v_padrinho,
         indicado_em = now()
   where id = v_uid
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
  select interno.vincular_indicacao(p_codigo);
$$;

revoke all on function public.vincular_indicacao(text) from public, anon;
grant execute on function public.vincular_indicacao(text) to authenticated;

-- ---------------------------------------------------------------
-- 1 etiqueta DTF ao completar perfil do aluno (só indicado)
-- ---------------------------------------------------------------
create or replace function interno.liberar_etiqueta_boas_vindas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_dtf integer;
begin
  update public.perfil
     set etiquetas_boas_vindas = true,
         etiquetas_dtf = etiquetas_dtf + 1
   where id = v_uid
     and indicado_por is not null
     and not etiquetas_boas_vindas
     and exists (
       select 1 from public.filho f
        where f.perfil_id = v_uid
          and length(trim(f.nome)) >= 2
          and length(trim(f.escola)) >= 2
     )
  returning etiquetas_dtf into v_dtf;

  if v_dtf is null then
    select etiquetas_dtf into v_dtf from public.perfil where id = v_uid;
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
  select interno.liberar_etiqueta_boas_vindas();
$$;

revoke all on function public.liberar_etiqueta_boas_vindas() from public, anon;
grant execute on function public.liberar_etiqueta_boas_vindas() to authenticated;

-- ---------------------------------------------------------------
-- Pedido pelo WhatsApp vira compra (pendente 7 dias)
-- ---------------------------------------------------------------
create or replace function interno.registrar_compra(p_valor_centavos integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_indicador uuid;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Entre para somar no placar.' using errcode = '28000';
  end if;

  if p_valor_centavos is null or p_valor_centavos < 100 then
    raise exception 'Valor inválido.' using errcode = '22023';
  end if;

  select indicado_por into v_indicador
    from public.perfil
   where id = v_uid;

  insert into public.compra (perfil_id, valor_centavos, indicador_id)
  values (v_uid, p_valor_centavos, v_indicador)
  returning id into v_id;

  -- 1ª compra pelo fluxo do link: completa até 5 etiquetas (por conta)
  update public.perfil
     set etiquetas_primeira_compra = true,
         etiquetas_dtf = 5
   where id = v_uid
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
  select interno.registrar_compra(p_valor_centavos);
$$;

revoke all on function public.registrar_compra(integer) from public, anon;
grant execute on function public.registrar_compra(integer) to authenticated;

-- ---------------------------------------------------------------
-- Placar R$ 350 repetível
-- ---------------------------------------------------------------
create or replace function interno.placar_indicacao()
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
  v_uid uuid := auth.uid();
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
  where p.id = v_uid;

  v_confirmado := coalesce(confirmado_centavos, 0);

  select count(*)::int into v_resgatadas
    from public.resgate r
   where r.perfil_id = v_uid
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
  select * from interno.placar_indicacao();
$$;

revoke all on function public.placar_indicacao() from public, anon;
grant execute on function public.placar_indicacao() to authenticated;

-- ---------------------------------------------------------------
-- Pedir resgate (1 camiseta, entrega em casa)
-- ---------------------------------------------------------------
create or replace function interno.pedir_resgate(p_endereco text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_confirmado int;
  v_resgatadas int;
  v_id uuid;
  v_end text := trim(p_endereco);
begin
  if v_uid is null then
    raise exception 'Entre para pedir o resgate.' using errcode = '28000';
  end if;

  if length(v_end) < 10 then
    raise exception 'Informe o endereço completo para a entrega.' using errcode = '22023';
  end if;

  perform interno.confirmar_compras_vencidas();

  select coalesce(sum(valor_centavos), 0)::int into v_confirmado
    from public.compra
   where indicador_id = v_uid and status = 'confirmada';

  select count(*)::int into v_resgatadas
    from public.resgate
   where perfil_id = v_uid and status <> 'cancelado';

  if (v_confirmado / 35000) - v_resgatadas < 1 then
    raise exception 'Ainda não há camiseta para resgatar.' using errcode = 'P0001';
  end if;

  insert into public.resgate (perfil_id, endereco)
  values (v_uid, v_end)
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
  select interno.pedir_resgate(p_endereco);
$$;

revoke all on function public.pedir_resgate(text) from public, anon;
grant execute on function public.pedir_resgate(text) to authenticated;
