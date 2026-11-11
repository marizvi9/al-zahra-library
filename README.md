# Al-Zahra Islamic Library website

Catalogue website for the Al-Zahra Islamic Library at the Islamic Education Center of Houston.

## Everyday commands

| What | Command |
|---|---|
| Preview the site while editing (http://localhost:3000) | `npm run dev` |
| Re-clean the data after the spreadsheet changes | `npm run clean-data` |
| Look for cover art again (takes ~30 min; cached after the first run) | `npm run covers` |
| Build the final site into the `out/` folder | `npm run build` |

## Publishing

The site is published at **https://marizvi9.github.io/al-zahra-library/**.
Every time changes are pushed to the `main` branch on GitHub, it rebuilds and
updates automatically (see `.github/workflows/deploy.yml`; progress shows in the
repository's **Actions** tab).

## Where things are

- `Al-Zahra_Library_Catalog.csv` — the original spreadsheet. **Never edited**; the script only reads it. Kept on the library computer only, not on GitHub.
- `private/` — the full cleaned data (with librarian notes) and the cleaning report. Also kept off GitHub.
- `scripts/clean_catalog.py` — cleans the spreadsheet. All fixes are listed at the top of the file.
- `data/books.json` — the cleaned catalogue the site uses (generated, don't edit by hand).
- `scripts/fetch_covers.mjs` — finds cover images on Open Library and Google Books and saves them to `public/covers/`.
- `data/covers.json` — which book has which cover images. To remove a wrong cover, delete that book's entry **and** add its id to `data/covers-rejected.json` (e.g. `[12, 345]`) so it isn't fetched again.
- `data/covers-report.md` — every cover match, so you can check them.
- `src/lib/categoryInfo.ts` — the one-line category descriptions (drafts — edit freely).
- `src/app/globals.css` — colours, fonts and layout. Colours are at the top.
- `public/logos/` — placeholder logos (header and welcome intro). Replace with the real files, same names.
- `src/lib/categoryInfo.ts` — category descriptions, and the home page's featured / "More to explore" order.
