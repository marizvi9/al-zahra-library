// Find cover images for the catalogue and save them with the site.
//
//   node scripts/fetch_covers.mjs
//
// 1. Looks each book up on Open Library (and Google Books as a fallback).
// 2. Accepts a match only if the title AND author agree closely, so we don't
//    show the wrong cover. Books with no author need an exact, longer title.
// 3. Downloads the front cover plus any extra images of the same edition
//    (often the back cover), shrinks them, and saves them to public/covers/.
// 4. Writes data/covers.json (used by the site) and data/covers-report.md
//    (every match, so the librarian can check them).
//
// API answers are cached in .cache/ so re-running is quick and polite.

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".cache", "covers");
const OUT_IMG = path.join(ROOT, "public", "covers");
const UA = "AlZahraLibraryCatalog/1.0 (community library catalogue)";
const MAX_IMAGES = 4;

// Google Books API key: read from .env.local (a private file, never published).
// The file contains one line:  GOOGLE_BOOKS_API_KEY=your-key-here
let GOOGLE_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";
try {
  const env = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  GOOGLE_KEY ||= env.match(/^GOOGLE_BOOKS_API_KEY=(.+)$/m)?.[1].trim() ?? "";
  // Also accept a file that contains just the key on its own.
  if (!GOOGLE_KEY && /^[A-Za-z0-9_-]{30,}$/.test(env.trim())) GOOGLE_KEY = env.trim();
} catch {}
console.log(GOOGLE_KEY ? "Using Google Books with your API key." : "No Google Books key found — Open Library only.");

await fs.mkdir(CACHE, { recursive: true });
await fs.rm(OUT_IMG, { recursive: true, force: true }); // rebuilt from the cache each run
await fs.mkdir(OUT_IMG, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastCall = {};
const disabled = new Set(); // hosts that refused us (e.g. Google Books without an API key)
async function politeFetch(url, host, gap) {
  if (disabled.has(host)) return null;
  const wait = (lastCall[host] ?? 0) + gap - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall[host] = Date.now();
  if (disabled.has(host)) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
      if (res.status === 429 && host === "gb") {
        console.log("Google Books refused (quota or key problem) — using Open Library only.");
        disabled.add(host);
        return null;
      }
      if (res.status === 429 || res.status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      return res;
    } catch {
      await sleep(3000);
    }
  }
  return null;
}

async function cachedJson(url, host, gap, secret = "") {
  const file = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".json");
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  const res = await politeFetch(url + secret, host, gap);
  if (!res || !res.ok) return null;
  const data = await res.json();
  await fs.writeFile(file, JSON.stringify(data));
  return data;
}

// ---------- matching helpers (shared with fetch_descriptions.mjs) ----------
import { accept, mainTitle, nameTokens } from "./lib/match.mjs";

// ---------- sources ----------
async function openLibrary(book) {
  const fields = "key,title,subtitle,author_name,cover_i,cover_edition_key";
  const surname = nameTokens(book.author ?? "").at(-1);
  const searches = [];
  if (surname) searches.push(new URLSearchParams({ q: `${mainTitle(book.title)} ${surname}`, fields, limit: "10" }));
  searches.push(new URLSearchParams({ title: mainTitle(book.title), fields, limit: "10" }));
  const docs = [];
  for (const q of searches) {
    const data = await cachedJson(`https://openlibrary.org/search.json?${q}`, "ol", 1100);
    docs.push(...(data?.docs ?? []));
    if (docs.some((d) => d.cover_i)) break;
  }
  const data = { docs };
  for (const d of data?.docs ?? []) {
    const full = d.subtitle ? `${d.title}: ${d.subtitle}` : d.title;
    if (!d.cover_i || !(accept(book, full, d.author_name) || accept(book, d.title, d.author_name))) continue;
    let ids = [d.cover_i];
    if (d.cover_edition_key) {
      const ed = await cachedJson(`https://openlibrary.org/books/${d.cover_edition_key}.json`, "ol", 1100);
      ids = [...new Set([d.cover_i, ...(ed?.covers ?? []).filter((c) => c > 0)])];
    }
    return {
      source: "Open Library",
      sourceUrl: `https://openlibrary.org${d.key}`,
      matchedTitle: full,
      matchedAuthor: (d.author_name ?? []).join(", "),
      urls: ids.slice(0, MAX_IMAGES).map((id) => `https://covers.openlibrary.org/b/id/${id}-L.jpg?default=false`),
    };
  }
  return null;
}

async function googleBooks(book) {
  let q = `intitle:"${mainTitle(book.title)}"`;
  const surname = nameTokens(book.author ?? "").at(-1);
  if (surname) q += ` inauthor:${surname}`;
  if (!GOOGLE_KEY) return null;
  // The cache file name is a hash of the URL *without* the key.
  const base = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`;
  const data = await cachedJson(base, "gb", 1100, `&key=${GOOGLE_KEY}`);
  for (const item of data?.items ?? []) {
    const v = item.volumeInfo ?? {};
    const full = v.subtitle ? `${v.title}: ${v.subtitle}` : v.title;
    const img = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
    if (!img || !(accept(book, full, v.authors) || accept(book, v.title, v.authors))) continue;
    // zoom=1 + fife=w1600 asks for the largest scan Google has (up to 1600px wide;
    // some books only have 300px). Other zoom levels return a "no image" picture.
    const big = `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1&fife=w1600&source=gbs_api`;
    return {
      source: "Google Books",
      sourceUrl: v.infoLink ?? v.canonicalVolumeLink,
      matchedTitle: full,
      matchedAuthor: (v.authors ?? []).join(", "),
      urls: [big],
    };
  }
  return null;
}

// ---------- images ----------
async function saveImage(url, outName) {
  const host = new URL(url).host;
  const rawFile = path.join(CACHE, "raw-" + crypto.createHash("sha1").update(url).digest("hex"));
  let buf;
  try {
    buf = await fs.readFile(rawFile);
  } catch {
    const res = await politeFetch(url, host, 400);
    if (!res || !res.ok) return null;
    buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(rawFile, buf);
  }
  try {
    const meta = await sharp(buf).metadata();
    if (!meta.width || meta.width < 80 || meta.height < 100) return null; // placeholder / too small
    if (host === "books.google.com" && meta.format === "png") return null; // Google's "image not available"
    // Three sizes: a tiny thumbnail for lists, a medium image for the book page,
    // and the largest available (capped at 1400px wide) for the enlarged view.
    const base = outName.replace(/\.webp$/, "");
    const save = (name, width, height, quality) =>
      sharp(buf)
        .resize({ width, height, fit: "inside", withoutEnlargement: true })
        .webp({ quality })
        .toFile(path.join(OUT_IMG, name));
    const thumb = await save(`${base}-thumb.webp`, 96, 144, 72);
    const md = await save(`${base}.webp`, 520, 780, 80);
    let large = md;
    let largeName = `${base}.webp`;
    if (meta.width > md.width * 1.15) {
      largeName = `${base}-lg.webp`;
      large = await save(largeName, 1400, 2100, 82);
    }
    // A tiny greyscale "fingerprint" to spot duplicate scans of the same image.
    const sig = await sharp(path.join(OUT_IMG, `${base}.webp`)).resize(12, 18, { fit: "fill" }).greyscale().raw().toBuffer();
    return {
      src: `/covers/${base}.webp`,
      width: md.width,
      height: md.height,
      thumb: `/covers/${base}-thumb.webp`,
      large: `/covers/${largeName}`,
      largeWidth: large.width,
      largeHeight: large.height,
      sig,
    };
  } catch {
    return null;
  }
}

// ---------- main ----------
const books = JSON.parse(await fs.readFile(path.join(ROOT, "data", "books.json"), "utf8")).filter(
  (b) => !b.removed && !b.titleMissing,
).slice(0, Number(process.env.LIMIT) || undefined); // LIMIT=20 to test on a few books
// Book ids whose covers were wrong: list them in data/covers-rejected.json, e.g. [12, 345]
let rejected = new Set();
try {
  rejected = new Set(JSON.parse(await fs.readFile(path.join(ROOT, "data", "covers-rejected.json"), "utf8")));
} catch {}
const covers = {};
const report = [];
let n = 0;
for (const book of books) {
  n++;
  if (rejected.has(book.id)) continue;
  let match = await openLibrary(book);
  if (!match) match = await googleBooks(book);
  if (match) {
    const images = [];
    for (const [i, url] of match.urls.entries()) {
      const img = await saveImage(url, `${book.id}-${i + 1}.webp`);
      if (!img) continue;
      // Skip near-identical copies of an image we already have.
      const dupe = images.some((k) => k.sig.reduce((sum, v, j) => sum + Math.abs(v - img.sig[j]), 0) / img.sig.length < 32);
      if (dupe) {
        for (const f of new Set([img.src, img.thumb, img.large])) await fs.rm(path.join(ROOT, "public", f), { force: true });
      }
      else images.push(img);
    }
    for (const img of images) delete img.sig;
    if (images.length) {
      const { urls, ...info } = match;
      covers[book.id] = { ...info, images };
      report.push(
        `| ${book.sourceRow} | ${book.title} | ${book.author ?? "—"} | ${match.matchedTitle} | ${match.matchedAuthor || "—"} | ${images.length} | [${match.source}](${match.sourceUrl}) |`,
      );
    }
  }
  if (n % 25 === 0) console.log(`${n}/${books.length} checked, ${Object.keys(covers).length} with covers`);
}

await fs.writeFile(path.join(ROOT, "data", "covers.json"), JSON.stringify(covers, null, 1));
await fs.writeFile(
  path.join(ROOT, "data", "covers-report.md"),
  [
    "# Cover art matches",
    "",
    `${Object.keys(covers).length} of ${books.length} books have cover images. Please glance through these:`,
    "if a cover is wrong, delete that book's entry from data/covers.json.",
    "",
    "| Row | Our title | Our author | Matched title | Matched author | Images | Source |",
    "|---|---|---|---|---|---|---|",
    ...report,
    "",
  ].join("\n"),
);
console.log(`Done: ${Object.keys(covers).length} of ${books.length} books have covers.`);
