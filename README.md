# TERRA web

Sitio público y CMS privado de TERRA. Usa Next.js 14 (App Router), React 18,
Tailwind CSS y Supabase (Database, Auth y Storage).

## Ejecución local

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. La landing está en `/` y el panel en `/admin`.

## Variables de entorno (local y Vercel)

Configurar las mismas variables en `.env.local` y en Vercel > Project Settings >
Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY
```

Son identificadores públicos previstos por Supabase; la seguridad depende de RLS,
no de ocultar la anon key. No usar `service_role` en Vercel ni en código cliente.
`NEXT_PUBLIC_ADMIN_EMAIL` ya no se utiliza y debe eliminarse de Vercel y del entorno
local después de desplegar esta versión.

## Preparación de Supabase

### 1. Auth por correo y contraseña

En Supabase Dashboard:

1. Authentication > Providers > Email: habilitar Email.
2. Authentication > Users: reutilizar el usuario existente y asignarle una
   contraseña, o crear uno nuevo. No habilitar un formulario de registro público.
3. Authentication > URL Configuration: definir Site URL con el dominio de
   producción y agregar `http://localhost:3000/**` y el dominio de Vercel a Redirect
   URLs. El callback se conserva para compatibilidad con confirmaciones/Magic Link.

La contraseña se guarda exclusivamente en Supabase Auth; nunca en el repositorio ni
en variables de entorno.

### 2. Auditoría previa de políticas

El repositorio no puede conocer las políticas actualmente activas en producción.
Antes de migrar, ejecutar y guardar el resultado de esta consulta en SQL Editor:

```sql
select
  policyname as policy_name,
  cmd as command,
  roles,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
```

Revisar especialmente policies antiguas con `INSERT`, `UPDATE`, `DELETE` o `ALL`
asignadas a `anon`, `public` o sin una condición administrativa. SQL no puede saber
si una policy antigua con otro nombre pertenece exclusivamente a TERRA: si permite
escritura pública sobre `discografia`, `flyers` o `merch`, eliminarla explícitamente
por su nombre antes de aplicar la migración.

La migración reemplaza las policies de las tablas de contenido, pero en
`storage.objects` elimina y recrea únicamente las cuatro policies con prefijo
`terra_assets_`. Las policies de otros buckets o aplicaciones permanecen intactas.

### 3. Aplicar SQL/RLS

Ejecutar completo en SQL Editor:

`supabase/migrations/20260910_admin_security.sql`

La migración no borra ni modifica contenido u objetos. Crea `admin_users`, habilita
RLS, mantiene lectura pública para el contenido de la landing y restringe INSERT,
UPDATE y DELETE a administradores autenticados. También deja lectura pública de los
buckets `discografia`, `flyers` y `merch`, con escritura/borrado sólo para admins.

### 4. Autorizar la cuenta administradora

Después de crear o actualizar el usuario en Authentication > Users, ejecutar
reemplazando sólo el correo:

```sql
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('tu-email@dominio.com')
on conflict (user_id) do nothing;
```

Verificar que insertó una fila:

```sql
select au.user_id, u.email
from public.admin_users au
join auth.users u on u.id = au.user_id;
```

Una cuenta autenticada que no esté en `admin_users` verá acceso denegado y RLS
bloqueará sus operaciones aunque intente llamar directamente a la API.

## Storage

Los buckets usados son `discografia`, `flyers` y `merch`. La migración los crea si
faltan o los conserva como públicos para que sus imágenes funcionen en la landing.
Sólo un usuario incluido en `admin_users` puede subir, actualizar o borrar objetos.
No borrar manualmente rutas referenciadas por las columnas `cover_path`, `flyer_path`
o `image_path`.

## Uso del panel

1. Abrir `/admin` desde PC, tablet o celular.
2. Ingresar correo y contraseña de la cuenta autorizada.
3. Elegir Historia, Redes, Discografía, Recitales, Merch o El Club.
4. Crear, editar, reemplazar imágenes o eliminar contenido.
5. Usar “Cerrar sesión” al terminar.

Las sesiones se guardan en cookies y el middleware de Supabase las refresca. La
autorización se comprueba en servidor y cada operación vuelve a ser validada por RLS.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Deploy en Vercel

1. Aplicar la migración y autorizar el usuario en Supabase.
2. Configurar las dos variables públicas en Production, Preview y Development según
   corresponda.
3. Desplegar el commit.
4. Probar `/`, `/admin`, persistencia tras recarga, cierre de sesión y una edición con
   imagen desde un teléfono.
5. Confirmar desde una sesión anónima que SELECT funciona y que INSERT/UPDATE/DELETE
   devuelven un error de RLS.

No se requiere ninguna variable secreta nueva ni cambios de versión de dependencias.
