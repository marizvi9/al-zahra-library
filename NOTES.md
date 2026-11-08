# Project notes

Catalogue website for the Al-Zahra Library at the Islamic Education Center (IEC).

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
- New **French & Italian** category (6 books). **4 books remain Uncategorised.**
- Missing author → publisher shown instead, or **Unknown**. Missing copy count → **1**
  (flagged `copiesAssumed` in the data). One row with no title shows "Title not recorded".
- **9 books marked "removed"** are hidden. The "not seen on shelf" book shows **Not available**.
- Call numbers are `Cat # · Sub Cat #` (Book # is empty in the whole spreadsheet).

### Website (Next.js + TypeScript, static, no backend)
- Home page with search and featured categories; browse by category and sub-category;
  instant search by title, author or category; a page per book with a "Find it on the shelf"
  call-number box.
- Design: cream/white with small blue and gold accents, light girih pattern, arched shapes,
  Noto fonts (incl. Arabic), right-to-left support, mobile-first and keyboard accessible.
- Smooth page transitions, covers that glide from lists into book pages, a 3D "turn the
  book" cover gallery with swipe/arrow keys/zoom. Motion is reduced if the visitor asks.

### Cover art
- **264 books have covers** (126 Open Library, 138 Google Books) via `scripts/fetch_covers.mjs`.
- Every match was checked by hand; 18 wrong matches are listed in `data/covers-rejected.json`.
- About 25 covers are generic XKP e-book designs — **kept until the real covers are added.**
- Google Books uses an API key stored in `.env.local` (private, never committed).

### Privacy
- The original CSV, `private/` (full data with librarian notes + cleaning report),
  `.env.local` and `.cache/` stay on this computer only (see `.gitignore`).

## What's left to do

- [ ] **Try the animations** on the live site (cover turning on *Punishment of Apostasy in
      Islam*, tap-to-enlarge, cover glide from lists) — only checked with still screenshots.
- [ ] **Add the flower logo** — placeholder in `src/components/Header.tsx` (instructions inside).
- [ ] **Replace the ~25 XKP covers** with photos of the library's own copies; photograph back
      covers too so the gallery has real backs to turn to. ~540 books still have no cover.
- [ ] **Categorise the 4 uncategorised books** (two also appear elsewhere with a category).
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
