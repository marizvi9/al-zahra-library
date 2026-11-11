# Project notes

Catalogue website for the Al-Zahra Islamic Library at the Islamic Education Center of Houston (IEC).

Brand: the official emblem is `public/brand/emblem.png`. It is redrawn as SVG in
`src/components/Emblem.tsx` (crisp at any size, and animatable). Colours come from the emblem:
parchment `#ECE3CE`, deep navy `#04142E`, antique gold `#AC8521` (see the top of `src/app/globals.css`).

- **Live site (Vercel):** https://al-zahra-library.vercel.app
- **Live site (GitHub Pages):** https://marizvi9.github.io/al-zahra-library/
- **Code:** https://github.com/marizvi9/al-zahra-library (public)
- Share the short Vercel address above. The long one-off Vercel addresses
  (`al-zahra-library-xxxx.vercel.app`) ask for a Vercel login — that's normal.

## What we've done

### Data
- Converted the catalogue (`Al-Zahra_Library_Catalog.csv`, Windows-1252 encoding) to clean
  UTF-8 data with `scripts/clean_catalog.py`. The original CSV is never edited.
- Fixed category spellings ("HIstory", "biography", stray spaces) and merged duplicate
  sub-categories (e.g. three spellings of "Ahl al-Bayt & Imams").
- Restored lost letters (Kitāb, Mahdī, Faqīh) and corrected 117 obvious typos in titles,
  authors and publishers — including undoing an accidental find-and-replace that had turned
  "Da'wah" into "Interfaith Dialogue & Dawah".
- Separate **French** (5 books) and **Italian** (1 book) categories. **4 books remain Uncategorized.**
- Missing author → publisher shown instead, or **Unknown**. Missing copy count → **1**
  (flagged `copiesAssumed` in the data). One row with no title shows "Title not recorded".
- **9 books marked "removed"** are hidden. The "not seen on shelf" book shows **Not available**.
- Call numbers are `Cat # · Sub Cat #` (Book # is empty in the whole spreadsheet).

### Website (Next.js + TypeScript, static, no backend)
- Home page with search and featured categories. The menu's **Explore** dropdown has two pages:
  - **Explore by shelves** (`/explore/`): shelf tabs labelled number + subject (All shelves, 100 · Theology
    … No number). "All shelves" shows one box per shelf (number, subject, count, short description) above
    every book; clicking a box shows just that shelf. Each shelf page has its description, section chips,
    a filter box, and a "Search this shelf" link (opens `/search/?category=…`). Old `/shelves/…` links forward here.
  - **Browse by categories** (`/categories/`): the simple version, with a card per category, then a page
    per category and sub-category. Category links on the home page and book pages open these.
  instant search by title, author or category; a page per book with a "Find it on the shelf"
  call-number box.
- Design: cream/white with small blue and gold accents, light girih pattern, arched shapes,
  Noto fonts (incl. Arabic), right-to-left support, mobile-first and keyboard accessible.
- Smooth page transitions, covers that glide from lists into book pages, a 3D "turn the
  book" cover gallery with swipe/arrow keys, and a full-screen viewer with pinch/scroll/click
  zoom. Motion is reduced if the visitor asks.
- Home page: the emblem, "Welcome to the Al-Zahra Islamic Library", and a
  **Featured books** slider (5 books). To swap a book, edit `data/featured-slider-books.json` and
  rebuild. The build stops with a clear message if a chosen book lacks an author, cover or description.
- **Book descriptions** ("About this book") on 160 book pages, copied from Google Books (153) or
  Open Library (7) by `node scripts/fetch_descriptions.mjs`, using the same strict title + author check
  as the covers (`scripts/lib/match.mjs`). Distributors' standard blurbs are removed. Check them in
  `data/descriptions-report.md`.
- Search bar suggestions: after 2+ characters the home page bar shows up to 7 books (cover, title,
  author, category) with keyboard and screen-reader support. Its data is `/search-index.json`,
  built with the site and downloaded only when the bar is first used.
- The "This catalogue lists the books the library holds…" notice sits above the footer on every
  page (`src/components/Disclaimer.tsx`).
- Welcome intro (once per visit, about 3 s, skippable, off with "reduce motion"): the SVG emblem's
  flower draws and blooms, the stars twinkle in, the letters settle, then it fades into the site
  (timings at the "Welcome intro" block in `globals.css`). Shelf tabs on Explore (one per Cat #, sections by
  Sub Cat #), faint geometric pattern on the cream background.

### Cover art
- **264 books have covers** (126 Open Library, 138 Google Books) via `scripts/fetch_covers.mjs`.
  Each is saved in three sizes: a tiny list thumbnail, a page image, and (for 26 books where
  the source has one) a large up-to-1400px version that loads only in the zoom view.
- Every match was checked by hand; 18 wrong matches are listed in `data/covers-rejected.json`.
- About 25 covers are generic XKP e-book designs — **kept until the real covers are added.**
- Google Books uses an API key stored in `.env.local` (private, never committed).

### Privacy
- The original CSV, `private/` (full data with librarian notes + cleaning report),
  `.env.local` and `.cache/` stay on this computer only (see `.gitignore`).

## What's left to do

- [ ] **Try the animations** on the live site (cover turning on *Punishment of Apostasy in
      Islam*, tap-to-enlarge, cover glide from lists) — only checked with still screenshots.
- [ ] **Replace the ~25 XKP covers** with photos of the library's own copies; photograph back
      covers too so the gallery has real backs to turn to. ~540 books still have no cover.
- [ ] **Categorize the 4 uncategorized books** (two also appear elsewhere with a category).
- [ ] **Review the draft category descriptions** in `src/lib/categoryInfo.ts`.
- [ ] **Librarian review:** typos left as recorded (e.g. "Fall of a Center of Decent"), books
      with no sub-category number (partial call numbers), and the copies set to 1.
- [ ] **Your own ideas** — still to be added.

## How to update

- Data changed? `npm run clean-data`, then `npm run covers` (cached; quick after the first run).
- Preview locally: `npm run dev` → http://localhost:3000
- Publish: merge or push to `main`. Two GitHub Actions workflows run:
  - `.github/workflows/vercel.yml` → **Vercel production** deploy (same setup as hello-site)
  - `.github/workflows/deploy.yml` → **GitHub Pages** deploy
- Pull requests get a **Vercel preview** deploy and a comment with the preview link.
  (Preview links ask for a Vercel login — Vercel protects previews by default.)
- Secrets used (Settings → Secrets and variables → Actions): `VERCEL_TOKEN`,
  `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Don't also turn on Vercel's own GitHub connection (`vercel git connect`) —
  that would deploy every change twice.
