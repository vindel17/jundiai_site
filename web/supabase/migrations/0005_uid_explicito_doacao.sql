-- Fase 4 — canal WhatsApp: identidade como parâmetro
-- Regras: ../../../whatsapp-agente.md §7 · ../../../modelo-de-negocio.md §3.4
--
-- Problema: o corpo da regra lia `auth.uid()`, então só funcionava com sessão
-- de cookie. O agente do WhatsApp não tem cookie.
--
-- Solução (uma regra, duas portas):
--   · `interno.X(p_uid, ...)`  — corpo único, identidade recebida de fora.
--   · `public.X(...)`          — porta do site; passa `auth.uid()`. Assinatura
--                                inalterada, então o app não muda.
--   · `public.X_como(p_uid, …)`— porta do agente; só `service_role` executa.
--
-- O que NÃO muda: nenhuma regra de negócio, nenhuma assinatura usada pelo site.

-- ---------------------------------------------------------------
-- Receptor pede a peça
-- ---------------------------------------------------------------
drop function if exists interno.pedir_peca(uuid);

create function interno.pedir_peca(p_uid uuid, p_anuncio_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doador uuid;
  v_id uuid;
begin
  if p_uid is null then
    raise exception 'Entre com seu WhatsApp para pedir uma peça.' using errcode = '28000';
  end if;

  select perfil_id into v_doador
    from public.anuncio
   where id = p_anuncio_id and status = 'ativo'
   for update;

  if v_doador is null then
    raise exception 'Esta peça não está mais disponível.' using errcode = 'P0002';
  end if;

  if v_doador = p_uid then
    raise exception 'Este anúncio é seu.' using errcode = 'P0001';
  end if;

  insert into public.doacao (anuncio_id, doador_id, receptor_id)
  values (p_anuncio_id, v_doador, p_uid)
  on conflict (anuncio_id, receptor_id) where status = 'combinando'
  do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
      from public.doacao
     where anuncio_id = p_anuncio_id
       and receptor_id = p_uid
       and status = 'combinando';
  end if;

  if v_id is null then
    raise exception 'Não conseguimos abrir o pedido. Tente de novo.' using errcode = 'P0003';
  end if;

  return v_id;
end;
$$;

create or replace function public.pedir_peca(p_anuncio_id uuid)
returns uuid
language sql
security definer
set search_path = interno, public
as $$
  select interno.pedir_peca(auth.uid(), p_anuncio_id);
$$;

revoke all on function public.pedir_peca(uuid) from public, anon;
grant execute on function public.pedir_peca(uuid) to authenticated;

create or replace function public.pedir_peca_como(p_uid uuid, p_anuncio_id uuid)
returns uuid
language sql
security definer
set search_path = interno, public
as $$
  select interno.pedir_peca(p_uid, p_anuncio_id);
$$;

revoke all on function public.pedir_peca_como(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.pedir_peca_como(uuid, uuid) to service_role;

-- ---------------------------------------------------------------
-- Doador aceita ou recusa
-- ---------------------------------------------------------------
drop function if exists interno.responder_pedido(uuid, boolean);

create function interno.responder_pedido(
  p_uid uuid,
  p_doacao_id uuid,
  p_aceitar boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anuncio uuid;
begin
  select anuncio_id into v_anuncio
    from public.doacao
   where id = p_doacao_id
     and doador_id = p_uid
     and status = 'combinando'
     and aceito_em is null
   for update;

  if v_anuncio is null then
    raise exception 'Pedido não encontrado.' using errcode = 'P0002';
  end if;

  if p_aceitar then
    update public.doacao set aceito_em = now() where id = p_doacao_id;
    update public.anuncio set status = 'reservado' where id = v_anuncio;

    update public.doacao
       set status = 'cancelada'
     where anuncio_id = v_anuncio
       and id <> p_doacao_id
       and status = 'combinando';

    return 'aceito';
  end if;

  update public.doacao set status = 'cancelada' where id = p_doacao_id;
  return 'recusado';
end;
$$;

create or replace function public.responder_pedido(
  p_doacao_id uuid,
  p_aceitar boolean
)
returns text
language sql
security definer
set search_path = interno, public
as $$
  select interno.responder_pedido(auth.uid(), p_doacao_id, p_aceitar);
$$;

revoke all on function public.responder_pedido(uuid, boolean) from public, anon;
grant execute on function public.responder_pedido(uuid, boolean) to authenticated;

create or replace function public.responder_pedido_como(
  p_uid uuid,
  p_doacao_id uuid,
  p_aceitar boolean
)
returns text
language sql
security definer
set search_path = interno, public
as $$
  select interno.responder_pedido(p_uid, p_doacao_id, p_aceitar);
$$;

revoke all on function public.responder_pedido_como(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.responder_pedido_como(uuid, uuid, boolean) to service_role;

-- ---------------------------------------------------------------
-- Contato das partes — só depois do aceite
-- ---------------------------------------------------------------
drop function if exists interno.contato_da_doacao(uuid);

create function interno.contato_da_doacao(p_uid uuid, p_doacao_id uuid)
returns table (nome text, telefone text, papel text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  d public.doacao;
begin
  select * into d
    from public.doacao
   where id = p_doacao_id
     and aceito_em is not null
     and status <> 'cancelada'
     and (doador_id = p_uid or receptor_id = p_uid);

  if d.id is null then
    return;
  end if;

  return query
    select p.nome_responsavel,
           p.telefone,
           case when d.doador_id = p_uid then 'receptor' else 'doador' end
      from public.perfil p
     where p.id = case when d.doador_id = p_uid then d.receptor_id else d.doador_id end;
end;
$$;

create or replace function public.contato_da_doacao(p_doacao_id uuid)
returns table (nome text, telefone text, papel text)
language sql
stable
security definer
set search_path = interno, public
as $$
  select * from interno.contato_da_doacao(auth.uid(), p_doacao_id);
$$;

revoke all on function public.contato_da_doacao(uuid) from public, anon;
grant execute on function public.contato_da_doacao(uuid) to authenticated;

create or replace function public.contato_da_doacao_como(p_uid uuid, p_doacao_id uuid)
returns table (nome text, telefone text, papel text)
language sql
stable
security definer
set search_path = interno, public
as $$
  select * from interno.contato_da_doacao(p_uid, p_doacao_id);
$$;

revoke all on function public.contato_da_doacao_como(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.contato_da_doacao_como(uuid, uuid) to service_role;

-- ---------------------------------------------------------------
-- Dupla confirmação da entrega + placar 2→1
-- ---------------------------------------------------------------
drop function if exists interno.confirmar_entrega(uuid);

create function interno.confirmar_entrega(p_uid uuid, p_doacao_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.doacao;
  v_conta boolean;
begin
  select * into d
    from public.doacao
   where id = p_doacao_id
     and status = 'combinando'
     and aceito_em is not null
     and (doador_id = p_uid or receptor_id = p_uid)
   for update;

  if d.id is null then
    raise exception 'Doação não encontrada.' using errcode = 'P0002';
  end if;

  if d.doador_id = p_uid then
    update public.doacao
       set doador_confirmou_em = coalesce(doador_confirmou_em, now())
     where id = d.id
    returning * into d;
  else
    update public.doacao
       set receptor_confirmou_em = coalesce(receptor_confirmou_em, now())
     where id = d.id
    returning * into d;
  end if;

  if d.doador_confirmou_em is null or d.receptor_confirmou_em is null then
    return 'aguardando';
  end if;

  v_conta := not exists (
    select 1
      from public.doacao x
     where x.conta_para_recompensa
       and (
         (x.doador_id = d.doador_id and x.receptor_id = d.receptor_id)
         or (
           x.doador_id = d.receptor_id
           and x.receptor_id = d.doador_id
           and x.concluida_em > now() - interval '180 days'
         )
       )
  );

  update public.doacao
     set status = 'concluida',
         concluida_em = now(),
         conta_para_recompensa = v_conta
   where id = d.id;

  update public.anuncio set status = 'concluido' where id = d.anuncio_id;

  return 'concluida';
end;
$$;

create or replace function public.confirmar_entrega(p_doacao_id uuid)
returns text
language sql
security definer
set search_path = interno, public
as $$
  select interno.confirmar_entrega(auth.uid(), p_doacao_id);
$$;

revoke all on function public.confirmar_entrega(uuid) from public, anon;
grant execute on function public.confirmar_entrega(uuid) to authenticated;

create or replace function public.confirmar_entrega_como(p_uid uuid, p_doacao_id uuid)
returns text
language sql
security definer
set search_path = interno, public
as $$
  select interno.confirmar_entrega(p_uid, p_doacao_id);
$$;

revoke all on function public.confirmar_entrega_como(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.confirmar_entrega_como(uuid, uuid) to service_role;

-- ---------------------------------------------------------------
-- Placar do doador: 2 doações contáveis → 1 peça nova
-- ---------------------------------------------------------------
drop function if exists interno.placar_doacao();

create function interno.placar_doacao(p_uid uuid)
returns table (concluidas int, contaveis int, pecas int, faltam int)
language sql
stable
security definer
set search_path = public
as $$
  with c as (
    select
      count(*)::int as concluidas,
      count(*) filter (where conta_para_recompensa)::int as contaveis
      from public.doacao
     where doador_id = p_uid
       and status = 'concluida'
  )
  select concluidas,
         contaveis,
         (contaveis / 2)::int,
         case when contaveis % 2 = 0 then 2 else 1 end
    from c;
$$;

create or replace function public.placar_doacao()
returns table (concluidas int, contaveis int, pecas int, faltam int)
language sql
stable
security definer
set search_path = interno, public
as $$
  select * from interno.placar_doacao(auth.uid());
$$;

revoke all on function public.placar_doacao() from public, anon;
grant execute on function public.placar_doacao() to authenticated;

create or replace function public.placar_doacao_como(p_uid uuid)
returns table (concluidas int, contaveis int, pecas int, faltam int)
language sql
stable
security definer
set search_path = interno, public
as $$
  select * from interno.placar_doacao(p_uid);
$$;

revoke all on function public.placar_doacao_como(uuid)
  from public, anon, authenticated;
grant execute on function public.placar_doacao_como(uuid) to service_role;
