# Ministerio Cristiano Shekinah Church Hub

A mobile-first bilingual church website and lightweight CMS for Ministerio Cristiano Shekinah in Los Angeles.

## Live site

GitHub Pages serves the website from the `main` branch.

The public site reads current service information, active announcements, and published newsletters from Supabase. The admin portal uses Supabase Auth and an allow-list stored in `public.admin_users`.

## Current production features

- English / Spanish public website
- Live service day and time
- Apple Maps and Google Maps directions
- Public announcements
- Newsletter archive
- Private admin portal
- Announcement create / edit / publish / hide / delete
- Newsletter draft / edit / publish / unpublish / delete
- Owner / Admin roles
- Owner-only administrator management
- Protected Supabase Edge Function for administrator invitations and role changes

## Security model

- Only a Supabase **publishable** key is present in browser code.
- Never commit a Supabase secret key or legacy `service_role` key.
- Supabase Auth verifies administrator identities.
- `public.admin_users` is the authorization allow-list.
- Row Level Security and PostgreSQL grants are the server-side authorization boundary.
- Anonymous visitors can read only the singleton public service row, active announcements, and published newsletters.
- Authenticated users who are not allow-listed do not receive CMS write access.
- Allow-listed Admins can manage church content but cannot manage administrators.
- Owners have content access plus administrator management.
- The final Owner cannot be removed or demoted.
- Browser clients cannot directly insert, update, or delete `admin_users` rows.
- Administrator changes are performed by the protected `admin-users` Edge Function.
- Public CMS pages fail closed when the configured Supabase backend is unavailable rather than displaying stale JSON content.
- Editable public content is HTML-escaped before rendering.

## Canonical Supabase setup

For a new project, apply the committed migrations **in order**:

1. `supabase/migrations/202608090001_complete_production_schema.sql`
2. `supabase/migrations/202608090002_admin_roles.sql`
3. `supabase/migrations/202608090003_security_hardening.sql`
4. `supabase/migrations/202608090004_service_role_least_privilege.sql`
5. `supabase/migrations/202608090005_public_content_query_indexes.sql`

Then:

6. Create the initial administrator in Supabase Authentication.
7. Add that user's UUID to `public.admin_users` if the allow-list is empty.
8. Ensure at least one row in `public.admin_users` has `role = 'owner'`.
9. Deploy `supabase/functions/admin-users/index.ts` as the `admin-users` Edge Function.
10. Disable public signups because the website has no public registration flow.
11. Verify the RLS and role behavior described in `ADMINISTRATORS_SETUP.md` before inviting additional administrators.

`supabase-admin-setup.sql` is historical reference only. It is **not** the canonical production setup.

Do not automatically apply repository migrations to production. Review and apply database changes deliberately through a controlled Supabase deployment process.

## Public content behavior

### Service settings

The homepage reads `public.service_settings` row `id = 1`. The service time is entered once in Admin and formatted for public display automatically.

### Announcements

The public homepage reads active Supabase announcements only. The committed `announcements.json` file is intentionally empty so a backend outage cannot resurrect an announcement that was hidden or deleted in the CMS.

### Newsletters

The public newsletter page reads only rows where:

- `status = 'published'`
- `published_at` is not null

Older published issues remain available in the archive. Draft and Ready issues remain private. The committed `newsletters.json` file is intentionally empty so a backend outage cannot resurrect an unpublished issue.

### Local development fallback

`service.json` remains as a harmless local/unconfigured fallback for service information. Once the production Supabase configuration is present, public CMS failures display an error instead of reverting to stale repository content.

## Administrator roles

### Owner

- Manage service settings
- Manage announcements
- Manage newsletters
- View the Administrators tab
- Invite administrators
- Promote or demote other administrators
- Remove administrator access

### Admin

- Manage service settings
- Manage announcements
- Manage newsletters
- Cannot manage administrator access

See `ADMINISTRATORS_SETUP.md` for the production administrator-management runbook.

## Main files

- `index.html` — homepage
- `newsletter.html` — newsletter and archive
- `style.css` — shared styling
- `script.js` — public language and Supabase content loading
- `admin.html` — admin portal
- `admin.js` — authentication and CMS behavior
- `admin-service-validation.js` — verifies service row updates before reporting success
- `administrators.js` — Owner-only administrator-management UI
- `supabase-config.js` — public Supabase URL and publishable key only
- `supabase/functions/admin-users/index.ts` — protected administrator-management Edge Function
- `supabase/migrations/` — canonical database migrations

## Church information

**Ministerio Cristiano Shekinah**  
2149 W Washington Blvd  
Los Angeles, CA 90018

The service day and time shown publicly are managed through the admin portal and may change for special services.

## Technology

- HTML
- CSS
- JavaScript
- GitHub Pages
- Supabase Postgres
- Supabase Auth
- Supabase Edge Functions
