-- Security hardening for the live Ministerio Cristiano Shekinah Supabase schema.
-- This migration is scoped to the four application tables and preserves existing rows.

begin;

create schema if not exists private;

-- Normalize newsletter publication metadata before enforcing the public-read rule.
update public.newsletters
set published_at = coalesce(
  updated_at,
  issue_date::timestamp at time zone 'UTC'
)
where status = 'published'
  and published_at is null;

alter table public.newsletters
  drop constraint if exists newsletters_status_check;
alter table public.newsletters
  add constraint newsletters_status_check
  check (status in ('draft', 'ready', 'published')) not valid;
alter table public.newsletters
  validate constraint newsletters_status_check;

alter table public.admin_users enable row level security;
alter table public.service_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.newsletters enable row level security;

-- Reset browser privileges only on the managed application tables, then grant
-- the smallest API surface the website actually needs. RLS provides row-level
-- authorization on top of these table privileges.
revoke all on table
  public.admin_users,
  public.service_settings,
  public.announcements,
  public.newsletters
from public, anon, authenticated;

grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.admin_users to service_role;

grant select on public.service_settings to anon, authenticated;
grant update (
  day_en,
  day_es,
  service_label_en,
  service_label_es,
  service_time,
  time_display,
  special_message_en,
  special_message_es,
  address,
  updated_at,
  updated_by
) on public.service_settings to authenticated;

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

grant select on public.newsletters to anon, authenticated;
grant insert, update, delete on public.newsletters to authenticated;

-- Remove every legacy policy on the managed tables so permissive policies do not
-- accidentally combine with the canonical rules below.
do $remove_managed_table_policies$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'admin_users',
        'service_settings',
        'announcements',
        'newsletters'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      existing_policy.policyname,
      existing_policy.schemaname,
      existing_policy.tablename
    );
  end loop;
end
$remove_managed_table_policies$;

create policy "Users can verify their own admin entry"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Public can read singleton service settings"
on public.service_settings
for select
to anon, authenticated
using (id = 1);

create policy "Admins can update singleton service settings"
on public.service_settings
for update
to authenticated
using (
  id = 1
  and exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  id = 1
  and exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Anonymous can read active announcements"
on public.announcements
for select
to anon
using (active = true);

create policy "Authenticated can read allowed announcements"
on public.announcements
for select
to authenticated
using (
  active = true
  or exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admins can insert announcements"
on public.announcements
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admins can update announcements"
on public.announcements
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admins can delete announcements"
on public.announcements
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Anonymous can read published newsletters"
on public.newsletters
for select
to anon
using (status = 'published' and published_at is not null);

create policy "Authenticated can read allowed newsletters"
on public.newsletters
for select
to authenticated
using (
  (status = 'published' and published_at is not null)
  or exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admins can insert newsletters"
on public.newsletters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admins can update newsletters"
on public.newsletters
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

create policy "Admins can delete newsletters"
on public.newsletters
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  )
);

-- The old policy helper is no longer required by browser-facing policies.
revoke execute on function private.is_admin() from public, anon, authenticated;

-- This event-trigger helper is useful internally for automatically enabling RLS
-- on newly created public tables, but it must not be callable through the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Enforce the "at least one Owner" rule in the database as well as in the Edge
-- Function. The advisory transaction lock serializes owner demotion/removal.
create or replace function private.prevent_last_owner_loss()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    perform pg_catalog.pg_advisory_xact_lock(20260809, 9003);
    if not exists (
      select 1
      from public.admin_users
      where role = 'owner'
        and user_id <> old.user_id
    ) then
      raise exception 'At least one Owner must remain.' using errcode = '23514';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    perform pg_catalog.pg_advisory_xact_lock(20260809, 9003);
    if not exists (
      select 1
      from public.admin_users
      where role = 'owner'
        and user_id <> old.user_id
    ) then
      raise exception 'At least one Owner must remain.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function private.prevent_last_owner_loss() from public, anon, authenticated;

drop trigger if exists protect_last_owner on public.admin_users;
create trigger protect_last_owner
before delete or update of role on public.admin_users
for each row
execute function private.prevent_last_owner_loss();

commit;
