# Ministerio Shekinah Church Hub

A mobile-first bilingual church website for Ministerio Shekinah in Los Angeles.

## Current version: 0.3

### New in v0.3

- English / Spanish language toggle
- Language choice is remembered in the visitor's browser
- Dedicated newsletter page
- Newsletter archive with individual issue links
- Announcements powered by `announcements.json`
- Newsletter content powered by `newsletters.json`

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
