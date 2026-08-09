# Owner and Administrator Management

This feature adds two portal roles:

- **Owner** — full content access plus administrator management.
- **Admin** — service, announcement, and newsletter management only.

The browser never receives a Supabase secret key. Inviting, removing, and changing administrator roles is handled by the protected `admin-users` Supabase Edge Function.

## Production setup

Apply the committed migrations in order. Do not skip directly to the role migration on a new or unknown database.

1. Apply `supabase/migrations/202608090001_complete_production_schema.sql`.
   - This is the canonical baseline for `admin_users`, `service_settings`, `announcements`, and `newsletters`.
   - It preserves existing rows and creates the compatibility helpers expected by later hardening migrations.
2. Apply `supabase/migrations/202608090002_admin_roles.sql`.
   - It adds the `role` column to `public.admin_users`.
   - If exactly one administrator already exists, that existing account becomes the initial `owner`.
   - It does not create or delete Auth users.
3. Apply `supabase/migrations/202608090003_security_hardening.sql`.
   - It installs the canonical browser grants and Row Level Security policies.
   - Public visitors can read only the singleton service row, active announcements, and published newsletters.
   - Authenticated content writes require membership in `admin_users`.
4. Apply `supabase/migrations/202608090004_service_role_least_privilege.sql`.
   - It limits `service_role` table access to the `admin_users` operations used by the protected Edge Function.
5. Deploy `supabase/functions/admin-users/index.ts` as the Edge Function named `admin-users`.
6. Sign out of the website admin portal, sign back in, and refresh the page.
7. The **Administrators** tab appears only when the signed-in allow-listed account has `role = 'owner'`.

### Required post-migration verification

Before adding another administrator, confirm in Supabase that:

- RLS is enabled on all four application tables.
- `anon` cannot read `admin_users`, hidden announcements, or unpublished newsletters.
- an authenticated account that is not in `admin_users` cannot create, update, or delete CMS content.
- an allow-listed administrator can still manage announcements, newsletters, and the singleton service row.
- at least one `owner` exists in `admin_users`.

## Security model

- `admin_users` remains the authorization allow-list.
- Browser roles do not receive INSERT, UPDATE, or DELETE privileges on `admin_users`.
- The Edge Function verifies the caller is an allow-listed `owner` before using its server-side privileged Supabase client.
- New invitations are added as `admin` by default.
- Removing access deletes only the `admin_users` allow-list row. It does not delete the person's Supabase Auth account.
- The last Owner cannot be demoted or removed.
- Owners cannot remove their own access from the portal.

Supabase automatically provides secret API credentials to hosted Edge Functions. Never copy those secret credentials into `supabase-config.js`, `admin.js`, `administrators.js`, or any other browser-served file.
