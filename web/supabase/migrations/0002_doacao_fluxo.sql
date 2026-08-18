-- Fase 2 — fluxo de doação
-- Regras: ../../../modelo-de-negocio.md §4.3 · ../../../recompensas.md §1
--
-- Decisões desta fase:
--   · Feed borrado: quem não entrou recebe só a CONTAGEM.
--   · Contato: o receptor pede, o doador aceita, e só então o WhatsApp é revelado.
--   · Conclusão: dupla confirmação (doador e receptor).
--   · Um pedido reserva o anúncio inteiro — quantidade não é fracionada no MVP.
--
-- Corpo privilegiado em `interno`. Wrappers em `public` só encaminham a chamada.

-- ---------------------------------------------------------------
-- Feed borrado: contagem para quem ainda não entrou
-- ---------------------------------------------------------------
create or replace function interno.contar_anuncios_ativos(
  p_modelo_id text default null,
  p_tamanho text default null,
  p_escola text default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
    from public.anuncio a
   where a.status = 'ativo'
     and (coalesce(p_modelo_id, '') = '' or a.modelo_id = p_modelo_id)
     and (coalesce(p_tamanho, '') = '' or a.tamanho = p_tamanho)
     and (coalesce(p_escola, '') = '' or a.escola ilike '%' || p_escola || '%');
$$;

create or replace function public.contar_anuncios_ativos(
  p_modelo_id text default null,
  p_tamanho text default null,
  p_escola text default null
)
returns integer
language sql
stable
security definer
set search_path = interno, public
as $$
  select interno.contar_anuncios_ativos(p_modelo_id, p_tamanho, p_escola);
$$;

revoke all on function public.contar_anuncios_ativos(text, text, text) from public;
grant execute on function public.contar_anuncios_ativos(text, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------
-- Receptor pede a peça
-- ---------------------------------------------------------------
create or replace function interno.pedir_peca(p_anuncio_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receptor uuid := auth.uid();
  v_doador uuid;
  v_id uuid;
begin
  if v_receptor is null then
    raise exception 'Entre com seu WhatsApp para pedir uma peça.' using errcode = '28000';
  end if;

  select perfil_id into v_doador
    from public.anuncio
   where id = p_anuncio_id and status = 'ativo'
   for update;

  if v_doador is null then
    raise exception 'Esta peça não está mais disponível.' using errcode = 'P0002';
  end if;

  if v_doador = v_receptor then
    raise exception 'Este anúncio é seu.' using errcode = 'P0001';
  end if;

  insert into public.doacao (anuncio_id, doador_id, receptor_id)
  values (p_anuncio_id, v_doador, v_receptor)
  on conflict (anuncio_id, receptor_id) where status = 'combinando'
  do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
      from public.doacao
     where anuncio_id = p_anuncio_id
       and receptor_id = v_receptor
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
  select interno.pedir_peca(p_anuncio_id);
$$;

revoke all on function public.pedir_peca(uuid) from public, anon;
grant execute on function public.pedir_peca(uuid) to authenticated;

-- ---------------------------------------------------------------
-- Doador aceita ou recusa
-- ---------------------------------------------------------------
create or replace function interno.responder_pedido(
  p_doacao_id uuid,
  p_aceitar boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_anuncio uuid;
begin
  select anuncio_id into v_anuncio
    from public.doacao
   where id = p_doacao_id
     and doador_id = v_uid
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
  select interno.responder_pedido(p_doacao_id, p_aceitar);
$$;

revoke all on function public.responder_pedido(uuid, boolean) from public, anon;
grant execute on function public.responder_pedido(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------
-- Contato das partes — só depois do aceite
-- ---------------------------------------------------------------
create or replace function interno.contato_da_doacao(p_doacao_id uuid)
returns table (nome text, telefone text, papel text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  d public.doacao;
begin
  select * into d
    from public.doacao
   where id = p_doacao_id
     and aceito_em is not null
     and status <> 'cancelada'
     and (doador_id = v_uid or receptor_id = v_uid);

  if d.id is null then
    return;
  end if;

  return query
    select p.nome_responsavel,
           p.telefone,
           case when d.doador_id = v_uid then 'receptor' else 'doador' end
      from public.perfil p
     where p.id = case when d.doador_id = v_uid then d.receptor_id else d.doador_id end;
end;
$$;

create or replace function public.contato_da_doacao(p_doacao_id uuid)
returns table (nome text, telefone text, papel text)
language sql
stable
security definer
set search_path = interno, public
as $$
  select * from interno.contato_da_doacao(p_doacao_id);
$$;

revoke all on function public.contato_da_doacao(uuid) from public, anon;
grant execute on function public.contato_da_doacao(uuid) to authenticated;

-- ---------------------------------------------------------------
-- Dupla confirmação da entrega + placar 2→1
-- ---------------------------------------------------------------
create or replace function interno.confirmar_entrega(p_doacao_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  d public.doacao;
  v_conta boolean;
begin
  select * into d
    from public.doacao
   where id = p_doacao_id
     and status = 'combinando'
     and aceito_em is not null
     and (doador_id = v_uid or receptor_id = v_uid)
   for update;

  if d.id is null then
    raise exception 'Doação não encontrada.' using errcode = 'P0002';
  end if;

  if d.doador_id = v_uid then
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
  select interno.confirmar_entrega(p_doacao_id);
$$;

revoke all on function public.confirmar_entrega(uuid) from public, anon;
grant execute on function public.confirmar_entrega(uuid) to authenticated;

-- ---------------------------------------------------------------
-- Placar do doador: 2 doações contáveis → 1 peça nova
-- ---------------------------------------------------------------
create or replace function interno.placar_doacao()
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
     where doador_id = auth.uid()
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
  select * from interno.placar_doacao();
$$;

revoke all on function public.placar_doacao() from public, anon;
grant execute on function public.placar_doacao() to authenticated;
