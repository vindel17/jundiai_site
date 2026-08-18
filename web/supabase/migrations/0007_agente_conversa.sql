-- Fase 4 — canal WhatsApp: estado da conversa
-- Regras: ../../../whatsapp-agente.md §7
--
-- Por que no banco e não em memória: o Render tem filesystem efêmero, hiberna
-- e pode rodar mais de uma instância. Estado em processo se perde no deploy.
--
-- Estas tabelas são internas do agente: RLS ligada e nenhuma policy, então só
-- `service_role` (que ignora RLS) enxerga. Nem `anon` nem `authenticated` leem.

-- ---------------------------------------------------------------
-- agente_conversa — em que passo cada número está
-- ---------------------------------------------------------------
create table if not exists public.agente_conversa (
  wa_id text primary key,
  perfil_id uuid references public.perfil (id) on delete set null,
  passo text not null default 'inicio',
  dados jsonb not null default '{}'::jsonb,
  ultima_entrada_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.agente_conversa is
  'Estado da conversa do WhatsApp. Uma linha por número (wa_id).';
comment on column public.agente_conversa.perfil_id is
  'Nulo enquanto o número não casa com nenhuma conta.';
comment on column public.agente_conversa.dados is
  'Respostas parciais do passo atual (peça, tamanho, escola, bairro…).';
comment on column public.agente_conversa.ultima_entrada_em is
  'Última mensagem recebida do usuário — base da janela de 24h da Meta.';

create index if not exists agente_conversa_perfil_idx
  on public.agente_conversa (perfil_id);
create index if not exists agente_conversa_atualizado_idx
  on public.agente_conversa (atualizado_em);

create trigger agente_conversa_atualizado_em
  before update on public.agente_conversa
  for each row execute function public.tocar_atualizado_em();

alter table public.agente_conversa enable row level security;

-- ---------------------------------------------------------------
-- agente_mensagem — idempotência (a Meta reentrega o webhook)
-- ---------------------------------------------------------------
create table if not exists public.agente_mensagem (
  id text primary key,
  wa_id text not null,
  recebido_em timestamptz not null default now()
);

comment on table public.agente_mensagem is
  'ID de mensagem já processada. Sem isto, um retry da Meta duplica a ação.';

create index if not exists agente_mensagem_recebido_idx
  on public.agente_mensagem (recebido_em);

alter table public.agente_mensagem enable row level security;

-- ---------------------------------------------------------------
-- Limpeza — conversa parada e log de idempotência não crescem para sempre
-- ---------------------------------------------------------------
create or replace function interno.limpar_agente_antigo()
returns void
language sql
security definer
set search_path = public
as $$
  with c as (
    delete from public.agente_conversa
     where atualizado_em < now() - interval '30 days'
  )
  delete from public.agente_mensagem
   where recebido_em < now() - interval '7 days';
$$;

comment on function interno.limpar_agente_antigo() is
  'Agendar no pg_cron quando o agente entrar em produção.';
