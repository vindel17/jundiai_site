-- Reserva do kit 2027. A família não paga aqui.
-- Origem: panfleto, rede social, tráfego pago, indicação ou direto.
-- Só o service_role lê e grava. A tela da equipe passa por essa chave
-- depois de conferir o telefone em EQUIPE_TELEFONES.

create table if not exists public.reserva_familia (
  telefone text primary key,
  codigo_indicacao text not null,
  criado_em timestamptz not null default now()
);

comment on table public.reserva_familia is
  'Um telefone de WhatsApp, um link de indicação. Vários filhos ficam em reserva.';

create unique index if not exists reserva_familia_codigo_idx
  on public.reserva_familia (codigo_indicacao);

create table if not exists public.reserva (
  id uuid primary key default gen_random_uuid(),
  telefone text not null references public.reserva_familia (telefone),
  origem_canal text not null,
  origem_codigo text not null default '',
  origem_texto text not null default '',
  indicado_por_telefone text references public.reserva_familia (telefone),
  escola text not null,
  aluno_nome text not null,
  kit text not null,
  tamanho_curta text not null,
  tamanho_longa text not null,
  tamanho_inferior text not null,
  tamanho_calca text not null,
  tamanho_blusa text not null,
  status text not null default 'recebida',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint reserva_canal_chk check (
    origem_canal in ('panfleto', 'social', 'pago', 'indicacao', 'direto')
  ),
  constraint reserva_kit_chk check (kit in ('masculino', 'feminino')),
  constraint reserva_tam_curta_chk check (
    tamanho_curta in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G', 'GG')
  ),
  constraint reserva_tam_longa_chk check (
    tamanho_longa in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G', 'GG')
  ),
  constraint reserva_tam_inferior_chk check (
    tamanho_inferior in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G', 'GG')
  ),
  constraint reserva_tam_calca_chk check (
    tamanho_calca in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G', 'GG')
  ),
  constraint reserva_tam_blusa_chk check (
    tamanho_blusa in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G', 'GG')
  ),
  constraint reserva_sem_auto_indicacao check (
    indicado_por_telefone is distinct from telefone
  )
);

comment on table public.reserva is
  'Um aluno, um kit de 6 peças. A camiseta manga curta entra com um tamanho só, nas duas peças.';
comment on column public.reserva.origem_canal is
  'panfleto, social (orgânico), pago, indicacao ou direto.';
comment on column public.reserva.origem_codigo is
  'Código do panfleto, do anúncio, do perfil ou da família que indicou.';

create index if not exists reserva_telefone_idx on public.reserva (telefone);
create index if not exists reserva_escola_idx on public.reserva (escola);
create index if not exists reserva_origem_idx
  on public.reserva (origem_canal, origem_codigo);
create index if not exists reserva_criado_idx on public.reserva (criado_em desc);

create trigger reserva_atualizado_em
  before update on public.reserva
  for each row execute function public.tocar_atualizado_em();

alter table public.reserva_familia enable row level security;
alter table public.reserva enable row level security;
