-- A família pode tirar peças do kit e diz se prefere receber em casa ou
-- retirar na loja. A preferência muda depois; o kit completo tem entrega grátis.
-- Tamanho nulo é peça fora da reserva. Reservas antigas ficam com entrega nula.

alter table public.reserva
  alter column tamanho_curta drop not null,
  alter column tamanho_longa drop not null,
  alter column tamanho_inferior drop not null,
  alter column tamanho_calca drop not null,
  alter column tamanho_blusa drop not null;

-- O GG saiu da grade do kit: a lista do WhatsApp tem 10 linhas e uma é "Não quero esta peça".
alter table public.reserva
  drop constraint if exists reserva_tam_curta_chk,
  drop constraint if exists reserva_tam_longa_chk,
  drop constraint if exists reserva_tam_inferior_chk,
  drop constraint if exists reserva_tam_calca_chk,
  drop constraint if exists reserva_tam_blusa_chk,
  add constraint reserva_tam_curta_chk check (
    tamanho_curta in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G')
  ),
  add constraint reserva_tam_longa_chk check (
    tamanho_longa in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G')
  ),
  add constraint reserva_tam_inferior_chk check (
    tamanho_inferior in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G')
  ),
  add constraint reserva_tam_calca_chk check (
    tamanho_calca in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G')
  ),
  add constraint reserva_tam_blusa_chk check (
    tamanho_blusa in ('4', '6', '8', '10', '12', '14', 'P', 'M', 'G')
  );

alter table public.reserva
  add column if not exists entrega text;

alter table public.reserva
  drop constraint if exists reserva_entrega_chk,
  add constraint reserva_entrega_chk check (entrega in ('casa', 'loja'));

alter table public.reserva
  drop constraint if exists reserva_alguma_peca_chk,
  add constraint reserva_alguma_peca_chk check (
    coalesce(tamanho_curta, tamanho_longa, tamanho_inferior, tamanho_calca, tamanho_blusa)
      is not null
  );

comment on column public.reserva.entrega is
  'Preferência: casa ou loja. Nula nas reservas anteriores a esta pergunta.';
