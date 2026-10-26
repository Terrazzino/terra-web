-- Fase final de limpieza. EJECUTAR SOLO despues de desplegar el codigo que ya no
-- usa `fecha`, verificar produccion y confirmar que fecha_evento esta completa.
-- Esta migracion elimina la columna obsoleta y por eso no forma parte de la fase
-- compatible del despliegue.

begin;

do $$
begin
  if exists (select 1 from public.recitales where fecha_evento is null) then
    raise exception 'No se puede retirar fecha: existen recitales sin fecha_evento.';
  end if;
end;
$$;

alter table public.recitales
  alter column fecha_evento set not null;

drop index if exists public.idx_recitales_fecha;

alter table public.recitales
  drop column if exists fecha;

commit;
