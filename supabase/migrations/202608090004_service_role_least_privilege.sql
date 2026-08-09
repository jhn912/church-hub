-- Limit the server-side service role to only the table operations used by the
-- protected admin-users Edge Function.

begin;

revoke all on table
  public.admin_users,
  public.service_settings,
  public.announcements,
  public.newsletters
from service_role;

grant select, insert, update, delete
on public.admin_users
to service_role;

commit;
