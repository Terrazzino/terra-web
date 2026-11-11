-- Agrega una modalidad opcional de venta externa para las entradas.
-- Instagram y venta externa son alternativas mutuamente excluyentes.

begin;

alter table public.recitales
  add column if not exists ticket_url text;

comment on column public.recitales.ticket_url is
  'Enlace HTTP/HTTPS opcional para comprar entradas fuera de Instagram.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recitales_single_ticket_link_check'
      and conrelid = 'public.recitales'::regclass
  ) then
    alter table public.recitales
      add constraint recitales_single_ticket_link_check
      check (
        nullif(btrim(instagram_url), '') is null
        or nullif(btrim(ticket_url), '') is null
      );
  end if;
end;
$$;

commit;
