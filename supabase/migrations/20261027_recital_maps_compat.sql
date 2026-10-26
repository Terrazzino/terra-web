-- Fase compatible: agrega Maps y permite que el codigo nuevo deje de escribir
-- la fecha textual. No elimina columnas ni modifica datos existentes.

begin;

alter table public.recitales
  add column if not exists google_maps_url text;

comment on column public.recitales.google_maps_url is
  'Enlace opcional a la ubicacion del recital en Google Maps.';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recitales'
      and column_name = 'fecha'
  ) then
    alter table public.recitales alter column fecha drop not null;
  end if;
end;
$$;

commit;
