# Ministerio Shekinah Church Hub

A mobile-first bilingual church website for Ministerio Shekinah in Los Angeles.

## Current version: 0.4.1

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
- `admin.js` — admin preview and local draft behavior

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
