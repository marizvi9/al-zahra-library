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
- **Header:** one row — brand, then the tabs **Explore · Shelves · Authors**, then a search bar
  (`src/components/Header.tsx`). Under 1000px wide the search folds behind a 🔍 button; under 700px
  the tabs fold behind a **Menu** button. The home page and search results page have their own
  search boxes, so the header search is left out there.
  - **Explore** (`/explore/`): a card per category with its cover artwork and one-line description,
    then a page per category (`/explore/fiqh/`) and sub-category (`/explore/fiqh/worship/`).
    Descriptions and display spellings (e.g. "Ahlul-Bayt") are in `src/lib/categoryInfo.ts`;
    covers are drawn in `src/components/CategoryCover.tsx`: each category has its own deep colour
    and gold motif (the full colour + motif list is at the top of that file).
  - **Shelves** (`/shelves/`): shelf tabs (All shelves, 100 · Theology … No number); "All shelves" shows a
    box per shelf above every book. Each shelf page has section chips, a filter box and "Search this shelf".
  - **Authors** (`/authors/`): every author, A to Z, each with a page listing their books.
    Spellings of one person are grouped by `data/author-names.json` (please check it).
  - Old addresses forward: `/categories/…` → `/explore/…`, `/explore/300/` → `/shelves/300/`.
- **Authors data:** `data/authors.json` holds, for each author, the photo (Wikimedia Commons, free licences
  only, with credit + licence) and the short bio. Review list: `data/authors-report.md`.
  - **Bios** appear only on the author's own page, written in our own words (never copied), 1–3 sentences, and
    checked against the books we hold. Source order: **WikiShia first** (`"bioStatus": "WikiShia"`, 46 authors); if
    WikiShia has no article, Wikipedia or another reliable source (`"other source"`, 67). Sources are never mixed in
    one bio. Each bio links its source under it. `"from our data only"` (291) and `"needs review"` (9: the three holy
    figures, plus uncertain matches with a draft and a note) show just the catalogue line ("Author of 7 books…").
    To approve a draft, change its `bioStatus` to `"WikiShia"` or `"other source"`; to change or remove a bio, edit
    `bio` / `bioStatus` and rebuild. The review list (`data/authors-report.md`) shows needs-review first.
  - **Photos:** a small copy for lists and cards, and a large one (up to 640px, never enlarged) for the big
    portrait on the author's page. Each author's Wikipedia article is chosen by hand, then
    `node scripts/fetch_author_photos.mjs` fetches the photos and licences. A WikiShia photo is preferred when its
    file page states a free licence (only Ali al-Sistani and Ali Khamenei so far, CC BY-SA 2.0; marked
    `"photoSource": "WikiShia"` and never replaced by the script). Most WikiShia photos state no licence, so they're not used. Authors with no photo get a
    navy-and-gold initials badge (and a large initials panel on their page).
  - **Author pages** list the author's books large (`src/components/AuthorBooks.tsx`): big covers in a 3-column grid
    (2 on tablets, 1 on small phones), with title, category, shelf number and a link; one or two books get bigger cards.
  - **Face position:** each photo's `focus` (x, y in percent, set by eye) keeps the face centred whenever the photo is
    cropped, at any size; an optional `zoom` enlarges far-away shots in the small round badges.
  - The Prophet, the Imams, Lady Fatima and other holy figures (including books attributed to them) never get a
    picture and are never looked up (`src/lib/authorPhotos.ts` enforces this); their bios are left for you to write.
  - **Author names are links** everywhere (book pages, lists, search, slider, featured sections), except on the
    author's own page. A cell naming several people ("A & B", "Compiled by X & Y", "A Translated By: B") is
    split so each person has their own link and page (`creditParts()` in `src/lib/catalog.ts`). On clickable
    cards the title link is stretched over the card and author names sit on top, so links never nest.
- Instant search by title, author or category; a page per book with a "Find it on the shelf"
  call-number box, and each author linked to their page.
- **Recent searches:** the last 6, kept only in the visitor's own browser (`src/lib/recentSearches.ts`),
  shown when the search bar is clicked, each removable, plus "Clear all".
- **Home page sections** (all from the catalogue's own data): Featured books slider; then
  "New to Islamic beliefs? Start here" and Featured author: Murtaza Mutahhari; Explore by category;
  **Featured Authors** (5 large portraits, set in `featuredAuthors` in `data/home-featured-sections.json`);
  Authors in our collection (8 cards, leaving out the featured five); Featured author: Muhammad Baqir al-Sadr and "Building character";
  Multi-volume sets (2+ different volumes held, found from "Vol."/"Part" in titles); Browse by shelf number.
  The four featured sections and their books are set in `data/home-featured-sections.json`; the build
  stops if a chosen book lacks an author, a cover or a Google Books description.
- Design: parchment, deep navy and antique gold from the emblem; light girih pattern (bolder in the welcome
  arch, quieter and more spaced on the rest of the page); small gold star dividers between home sections and an
  arched top edge on the footer, so there are no hard lines;
  two fonts only, self-hosted with next/font: **Literata** (headings and reading text, 17px on phones / 18px on
  wider screens, line height 1.65, lines kept under ~72 characters) and **IBM Plex Sans Arabic** (menus,
  buttons, labels, the emblem lettering, and every Arabic/Persian/Urdu letter); right-to-left support,
  mobile-first and keyboard accessible.
- Smooth page transitions, covers that glide from lists into book pages, a 3D "turn the
  book" cover gallery with swipe/arrow keys, and a full-screen viewer with pinch/scroll/click
  zoom. Motion is reduced if the visitor asks.
- Home page: a compact welcome arch (emblem, "Welcome to the Al-Zahra Islamic Library", a gold divider, a
  one-line welcome and the search bar) on a soft navy-and-gold geometric pattern that fades in gently; then a
  **Featured books** slider (5 books). To swap a book, edit `data/featured-slider-books.json` and
  rebuild. The build stops with a clear message if a chosen book lacks an author, cover or description.
- **Book descriptions** ("About this book") on 160 book pages, copied from Google Books (153) or
  Open Library (7) by `node scripts/fetch_descriptions.mjs`, using the same strict title + author check
  as the covers (`scripts/lib/match.mjs`). Distributors' standard blurbs are removed. Check them in
  `data/descriptions-report.md`.
- Search bar suggestions: after 2+ characters the search bar shows up to 7 books (cover, title,
  author, category) with keyboard and screen-reader support. Its data is `/search-index.json`,
  built with the site and downloaded only when the bar is first used.
- The "This catalogue lists the books the library holds…" notice sits above the footer on every
  page (`src/components/Disclaimer.tsx`).
- Welcome intro (once per visit, about 3 s, skippable, off with "reduce motion"): the SVG emblem's
  flower draws and blooms, the stars twinkle in, the letters settle, then it fades into the site
  (timings at the "Welcome intro" block in `globals.css`). Shelf tabs on Shelves (one per Cat #, sections by
  Sub Cat #), faint geometric pattern on the cream background.

### Cover art
- **263 books have covers** (125 Open Library, 138 Google Books) via `scripts/fetch_covers.mjs`.
  Each is saved in three sizes: a tiny list thumbnail, a page image, and (for 26 books where
  the source has one) a large up-to-1400px version that loads only in the zoom view.
- Every match was checked by hand; 19 wrong matches are listed in `data/covers-rejected.json`.
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
