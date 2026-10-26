-- Fecha calendario comparable para recitales.
-- Migracion aditiva y no destructiva: conserva la columna fecha y todos sus datos.

begin;

alter table public.recitales
  add column if not exists fecha_evento date;

comment on column public.recitales.fecha_evento is
  'Fecha calendario del recital. Se usa para clasificar y ordenar; fecha conserva el rotulo visible.';

create index if not exists idx_recitales_fecha_evento
  on public.recitales (fecha_evento);

commit;

-- IMPORTANTE: los valores historicos de fecha no contienen anio, por lo que esta
-- migracion no intenta inferirlo. Luego de revisar cada registro, completar desde
-- el administrador o ejecutar sentencias explicitas como esta:
-- update public.recitales set fecha_evento = date '2026-11-07' where id = 123;
