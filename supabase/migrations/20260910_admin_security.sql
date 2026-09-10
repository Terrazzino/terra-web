-- TERRA admin security migration (non-destructive for application data/files).
-- Run once from Supabase Dashboard > SQL Editor, then add the admin user as
-- documented in README.md. This resets policies on the six content tables and
-- storage.objects; review the preflight query in README if this Supabase project
-- also serves unrelated applications.

begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array['admin_users', 'historia', 'redes', 'discografia', 'recitales', 'el_club', 'merch']
  loop
    for policy_name in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
  end loop;
end $$;

create policy "admin_users_read_self"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array['historia', 'redes', 'discografia', 'recitales', 'el_club', 'merch']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      table_name || '_public_read', table_name
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      table_name || '_admin_manage', table_name
    );
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('grant insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

grant usage, select on all sequences in schema public to authenticated;

insert into storage.buckets (id, name, public)
values
  ('discografia', 'discografia', true),
  ('flyers', 'flyers', true),
  ('merch', 'merch', true)
on conflict (id) do update set public = excluded.public;

-- Reset object policies so an older permissive write policy cannot override RLS.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', policy_name);
  end loop;
end $$;

create policy "terra_assets_public_read"
on storage.objects for select to anon, authenticated
using (bucket_id in ('discografia', 'flyers', 'merch'));

create policy "terra_assets_admin_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('discografia', 'flyers', 'merch')
  and (select public.is_admin())
);

create policy "terra_assets_admin_update"
on storage.objects for update to authenticated
using (
  bucket_id in ('discografia', 'flyers', 'merch')
  and (select public.is_admin())
)
with check (
  bucket_id in ('discografia', 'flyers', 'merch')
  and (select public.is_admin())
);

create policy "terra_assets_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id in ('discografia', 'flyers', 'merch')
  and (select public.is_admin())
);

commit;
