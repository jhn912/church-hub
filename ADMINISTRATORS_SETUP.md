# Owner and Administrator Management

This feature adds two portal roles:

- **Owner** — full content access plus administrator management.
- **Admin** — service, announcement, and newsletter management only.

The browser never receives a Supabase secret key. Inviting, removing, and changing administrator roles is handled by the protected `admin-users` Supabase Edge Function.

## Production setup

1. Apply `supabase/migrations/202608090002_admin_roles.sql` in the Supabase SQL Editor.
   - It adds the `role` column to `public.admin_users`.
   - If exactly one administrator already exists, that existing account becomes the initial `owner`.
   - It does not create or delete Auth users.
2. Deploy `supabase/functions/admin-users/index.ts` as the Edge Function named `admin-users` with JWT verification enabled (the default).
3. Sign out of the website admin portal, sign back in, and refresh the page.
4. The **Administrators** tab appears only when the signed-in allow-listed account has `role = 'owner'`.

## Security model

- `admin_users` remains the authorization allow-list.
- Browser roles do not receive INSERT, UPDATE, or DELETE privileges on `admin_users`.
- The Edge Function verifies the caller is an allow-listed `owner` before using its server-side privileged Supabase client.
- New invitations are added as `admin` by default.
- Removing access deletes only the `admin_users` allow-list row. It does not delete the person's Supabase Auth account.
- The last Owner cannot be demoted or removed.
- Owners cannot remove their own access from the portal.

Supabase automatically provides secret API credentials to hosted Edge Functions. Never copy those secret credentials into `supabase-config.js`, `admin.js`, `administrators.js`, or any other browser-served file.
