-- Canonical baseline schema for Ministerio Shekinah Church Hub.
-- Designed to preserve existing production rows while making fresh installs reproducible.

begin;

create schema if not exists private;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.service_settings (
  id smallint primary key default 1,
  day_en text not null default 'Sunday',
  day_es text not null default 'Domingo',
  service_label_en text not null default 'Sunday Service',
  service_label_es text not null default 'Servicio Dominical',
  service_time time not null default '15:00',
  time_display text not null default '3:00 PM',
  special_message_en text not null default '',
  special_message_es text not null default '',
  address text not null default '2149 W Washington Blvd, Los Angeles, CA 90018',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.service_settings
  add column if not exists address text;
update public.service_settings
set address = '2149 W Washington Blvd, Los Angeles, CA 90018'
where address is null;
alter table public.service_settings
  alter column address set default '2149 W Washington Blvd, Los Angeles, CA 90018',
  alter column address set not null;

insert into public.service_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.announcements (
  id text primary key,
  active boolean not null default false,
  tag_en text not null default 'Update',
  tag_es text not null default 'Actualización',
  title_en text not null,
  title_es text not null,
  description_en text not null default '',
  description_es text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists announcements_active_sort_idx
  on public.announcements (active, sort_order);

create table if not exists public.newsletters (
  id text primary key,
  issue_date date not null,
  status text not null default 'draft',
  title_en text not null,
  title_es text not null,
  gathering_en text not null default '',
  gathering_es text not null default '',
  scripture_en text not null default '',
  scripture_es text not null default '',
  community_en text not null default '',
  community_es text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create unique index if not exists newsletters_issue_date_unique_idx
  on public.newsletters (issue_date);
create index if not exists newsletters_public_idx
  on public.newsletters (status, published_at, issue_date desc);

alter table public.newsletters
  drop constraint if exists newsletters_status_check;
alter table public.newsletters
  add constraint newsletters_status_check
  check (status in ('draft', 'ready', 'published')) not valid;

-- Compatibility helpers retained only so older hardening migrations can safely
-- revoke their browser execution on fresh installs. Current policies do not rely
-- on either helper.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  return;
end;
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.service_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.newsletters enable row level security;

commit;
