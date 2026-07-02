# Mental Gymnasium

Landing page for *Mental Gymnasium* — a fictocriticism zine by Neo_SC.

The site is a single static page (`index.html`) with its interactive logic
extracted into `assets/join.js` so it can be tested without a build step.

## Development

The page is plain HTML/CSS/JS — open `index.html` in a browser, or serve the
folder with any static server:

```sh
npx serve .
```

## Tests

An automated safety net runs on every push/PR via GitHub Actions
(`.github/workflows/ci.yml`).

```sh
npm install
npm test        # run once
npm run test:watch
```

The suite (Vitest + jsdom) covers:

- **`assets/join.js`** — the join-form handler: mailto URL construction,
  percent-encoding (ampersands, newlines, non-ASCII / Thai), empty-field
  handling, `preventDefault`, the confirmation message swap, and the
  missing-element guard.
- **Link integrity** — every in-page `#anchor` resolves to a real element;
  external `target="_blank"` links carry `rel="noopener"`; the Buy Me a Coffee
  and `mailto:` CTAs point where expected.
- **SEO / social meta** — title, description, canonical, and Open Graph tags.
- **Page structure** — hero heading, the four nav sections, three support
  tiers, and the join form's fields.
- **Accessibility hygiene** — page language, labelled form controls, and
  `aria-hidden` on decorative elements.

### Possible next steps

For a design-forward page, browser-level checks add value beyond what jsdom
can see: Playwright screenshot/visual-regression at mobile + desktop
breakpoints, and `axe-core` for real color-contrast and layout-aware
accessibility auditing.
