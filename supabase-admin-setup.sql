-- Ministerio Shekinah admin authorization setup
-- Run this in the Supabase SQL Editor AFTER creating the admin user in Authentication.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon;
grant select on table public.admin_users to authenticated;

drop policy if exists "Authorized admins can verify themselves" on public.admin_users;

create policy "Authorized admins can verify themselves"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = user_id);

-- AFTER you create your administrator under Authentication > Users,
-- replace the value below with that user's UUID and run ONLY this INSERT line:
--
-- insert into public.admin_users (user_id)
-- values ('PASTE_ADMIN_USER_UUID_HERE')
-- on conflict (user_id) do nothing;
