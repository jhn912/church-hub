-- Add flexible, optional newsletter content without changing existing issues.

alter table public.newsletters
  add column if not exists optional_sections jsonb not null default '[]'::jsonb;

alter table public.newsletters
  drop constraint if exists newsletters_optional_sections_array;

alter table public.newsletters
  add constraint newsletters_optional_sections_array
  check (jsonb_typeof(optional_sections) = 'array') not valid;

alter table public.newsletters
  validate constraint newsletters_optional_sections_array;
