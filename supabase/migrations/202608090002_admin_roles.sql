-- Owner/admin role model for Ministerio Shekinah.
-- Safe to apply to the existing admin_users allow-list.

begin;

alter table public.admin_users
  add column if not exists role text;

update public.admin_users
set role = 'admin'
where role is null;

alter table public.admin_users
  alter column role set default 'admin',
  alter column role set not null;

alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check
  check (role in ('owner', 'admin')) not valid;

alter table public.admin_users
  validate constraint admin_users_role_check;

-- Bootstrap a single existing administrator as the first Owner. If a project has
-- zero or multiple allow-listed users, this block intentionally does nothing so
-- ownership can be assigned deliberately by the database owner.
do $bootstrap_single_owner$
declare
  admin_count integer;
begin
  select count(*) into admin_count from public.admin_users;

  if admin_count = 1 then
    update public.admin_users
    set role = 'owner';
  end if;
end
$bootstrap_single_owner$;

create index if not exists admin_users_role_idx
  on public.admin_users (role);

-- Browser clients still cannot add, remove, or change administrators directly.
-- The owner-only Edge Function performs privileged changes with a server-side key.
revoke insert, update, delete on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

commit;
