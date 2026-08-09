-- Indexes for the public homepage/newsletter read paths.
-- These mirror the filters and ordering used by script.js.

begin;

create index if not exists announcements_public_active_sort_idx
  on public.announcements (sort_order)
  where active = true;

create index if not exists newsletters_public_published_idx
  on public.newsletters (issue_date desc)
  where status = 'published' and published_at is not null;

commit;
