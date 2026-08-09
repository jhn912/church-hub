# Ministerio Shekinah Church Hub

A mobile-first bilingual church website for Ministerio Shekinah in Los Angeles.

## Current version: 0.6

### New in v0.6

The administrator portal now manages all recurring church content:

- **Service settings**
  - Day in English and Spanish
  - Service time
  - Display time
  - Bilingual service title
  - Optional bilingual special message
- **Announcements**
  - Add new announcements
  - Edit existing announcements
  - English and Spanish versions
  - Active/hidden status
  - Delete announcements
- **Newsletter**
  - English and Spanish editor
  - Issue date and status
  - Live preview
  - Scripture and community updates
- Added `service.json` so the public homepage can load service information dynamically.

Before Supabase is connected, the admin editor stores changes as browser drafts only.
After Supabase is connected, these same controls will be wired to live database publishing.

### New in v0.5

- Removed the admin dashboard preview bypass
- Added real Supabase email/password authentication integration
- Added persistent authenticated sessions
- Added secure sign out
- Added an `admin_users` allow-list check
- Added SQL setup for Row Level Security
- Admin editor remains inaccessible until authentication is configured
- Added `supabase-config.js` for the public Project URL and publishable key only

### Important security rule

Only put the Supabase **publishable** key in `supabase-config.js`.

Never commit a Supabase **secret** key or legacy `service_role` key to GitHub.

### v0.4.1 fix

- Added cache-busting asset versions so browsers load the new admin CSS and JavaScript correctly.
- Fixes the unstyled admin page caused by an older cached stylesheet.

### New in v0.4

- Admin login page interface
- Newsletter editor dashboard preview
- English / Spanish newsletter editing
- Live newsletter preview
- Browser-only draft saving
- Public developer note removed from announcements
- Admin link added to the footer

### Security status

The admin page is currently an interface prototype.

- Passwords are **not** stored or checked in JavaScript.
- The sign-in form does **not** authenticate anyone yet.
- Drafts are stored only in the current browser using `localStorage`.
- The Publish button does **not** modify the live website yet.

A secure authentication provider and backend must be connected before the admin system is used for real publishing.

### Existing features

- English / Spanish language toggle
- Dedicated newsletter page and archive
- JSON-powered announcements
- JSON-powered newsletter content

## Church information

**Ministerio Shekinah**  
2149 W Washington Blvd  
Los Angeles, CA 90018

**Sunday service:** 3:00 PM

## Files

- `index.html` — homepage
- `newsletter.html` — newsletter and archive page
- `style.css` — all website styling
- `script.js` — language toggle and dynamic content
- `announcements.json` — editable announcements
- `newsletters.json` — editable newsletter issues
- `admin.html` — admin login and newsletter editor interface
- `admin.js` — secure admin authentication and content-management behavior
- `service.json` — current service settings

## Updating announcements

Open `announcements.json`.

Each announcement looks like this:

```json
{
  "id": "example",
  "active": true,
  "tag_en": "Update",
  "tag_es": "Actualización",
  "title_en": "English title",
  "title_es": "Título en español",
  "description_en": "English announcement text.",
  "description_es": "Texto del anuncio en español."
}
```

Set `"active": false` to hide an announcement without deleting it.

## Adding a newsletter

Open `newsletters.json`.

The newest issue should be placed at the top of the list. Each issue has:

- a unique `id`
- English and Spanish dates
- English and Spanish titles
- one or more content sections

## Technology

- HTML
- CSS
- JavaScript
- JSON
- GitHub
- GitHub Pages

## Future ideas

- Church photos and logo
- Admin publishing page
- Events calendar
- Easier newsletter editor
- AI-assisted newsletter drafting with human review


## Secure admin setup

1. Create a Supabase project.
2. Copy the Project URL and Publishable key into `supabase-config.js`.
3. Create the administrator account in Supabase Authentication.
4. Run `supabase-admin-setup.sql` in the SQL Editor.
5. Add the administrator user's UUID to `public.admin_users`.
6. Disable public signups for the project because this site has no public registration flow.

The admin page checks the user's identity against Supabase Auth and then verifies that the authenticated user is present in the `admin_users` allow-list.
