-- Base de conhecimento do atendimento por IA e fila de aviso por peça.
-- A equipe edita o texto no painel. O modelo não grava estoque: só anota o aviso.

create table public.base_bot (
  id smallint primary key check (id = 1),
  texto text not null check (char_length(texto) <= 12000),
  atualizado_em timestamptz not null default now(),
  atualizado_por text not null default ''
);

insert into public.base_bot (id, texto, atualizado_por)
values (
  1,
  $base$
A Uniforme Jundiaí é uma loja independente. Vendemos o uniforme escolar da rede municipal de Jundiaí e não somos a Prefeitura, a Secretaria nem a escola.

A pré-reserva é gratuita. A família informa a escola e o nome do aluno, escolhe o kit masculino (bermuda) ou feminino (short-saia) e o tamanho de cada peça. Não há pagamento e a reserva não obriga a compra.

O kit tem 2 camisetas de manga curta, 1 camiseta de manga longa, 1 bermuda ou short-saia, 1 calça e 1 blusa de frio. Dá para escolher um tamanho diferente em cada peça e dispensar uma peça.

A família pode retirar na loja ou pedir entrega em casa. Para reservar, usa Reservar uniforme neste WhatsApp ou o site https://uniformejundiai.com.br/reserva.

A pré-reserva não substitui o cadastro da Prefeitura e não garante o crédito do voucher. Quem já reservou pode pedir aviso neste WhatsApp quando o voucher liberar.
$base$,
  'sistema'
);

create table public.aviso_peca (
  wa_id text not null,
  modelo_id text not null check (modelo_id in (
    'camiseta-manga-curta', 'camiseta-manga-longa', 'bermuda', 'short-saia', 'calca', 'blusa'
  )),
  tamanho text not null check (tamanho in ('4', '6', '8', '10', '12', '14', '16', 'P', 'M', 'G')),
  criado_em timestamptz not null default now(),
  primary key (wa_id, modelo_id, tamanho)
);

alter table public.base_bot enable row level security;
alter table public.aviso_peca enable row level security;
revoke all on public.base_bot, public.aviso_peca from public, anon, authenticated;
grant select on public.base_bot, public.aviso_peca to service_role;

create function public.salvar_base_bot(p_autor text, p_texto text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(p_texto) > 12000 then
    raise exception 'base longa';
  end if;
  insert into public.base_bot (id, texto, atualizado_por)
  values (1, p_texto, left(coalesce(p_autor, ''), 200))
  on conflict (id) do update
    set texto = excluded.texto,
        atualizado_em = now(),
        atualizado_por = excluded.atualizado_por;
end;
$$;

create function public.registrar_aviso_peca(p_wa_id text, p_modelo text, p_tamanho text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.aviso_peca (wa_id, modelo_id, tamanho)
  values (p_wa_id, p_modelo, p_tamanho)
  on conflict (wa_id, modelo_id, tamanho) do nothing;
end;
$$;

create function public.abrir_fila_whatsapp(p_wa_id text, p_id text, p_texto text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select a.id into v_id from public.atendimento_whatsapp a
    where a.wa_id = p_wa_id and a.encerrado_em is null
    for update;

  if v_id is null then
    insert into public.atendimento_whatsapp (wa_id) values (p_wa_id)
      returning id into v_id;
  end if;

  insert into public.atendimento_mensagem (id, atendimento_id, origem, texto, estado)
  values (p_id, v_id, 'cliente', left(p_texto, 4096), 'recebida')
  on conflict (id) do nothing;
  return true;
end;
$$;

revoke all on function public.salvar_base_bot(text, text) from public, anon, authenticated;
revoke all on function public.registrar_aviso_peca(text, text, text) from public, anon, authenticated;
revoke all on function public.abrir_fila_whatsapp(text, text, text) from public, anon, authenticated;
grant execute on function public.salvar_base_bot(text, text) to service_role;
grant execute on function public.registrar_aviso_peca(text, text, text) to service_role;
grant execute on function public.abrir_fila_whatsapp(text, text, text) to service_role;
