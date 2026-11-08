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

// ---------- matching helpers ----------
const HONORIFICS = new Set(
  ("ayatullah ayatollah ayatulla allamah allama imam sayyid sayed seyyed seyyid syed sayid sayyed shaykh sheikh " +
    "shaikh shiekh dr prof professor martyr maulana moulana hojjatul islam al the by compiled translated edited " +
    "and with mr mrs ms md phd hazrat haji hajj grand uzma " +
    // very common names: on their own they don't prove it's the same author
    "muhammad mohammad mohammed muhammed mohamed ahmad ahmed husain hussain husayn hussein hasan hassan " +
    "abdul abdullah abbas jafar jaffar reza rida raza mahdi mehdi").split(" "),
);
const norm = (s) =>
  (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’`ʿʾ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const mainTitle = (t) => t.split(/\s[-–:]\s|:\s|\(/)[0].trim();
const stripArticle = (s) => s.replace(/^(the|a|an) /, "");

function similarity(a, b) {
  if (a === b) return 1;
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

function titleMatches(bookTitle, candidate, strict) {
  const a = stripArticle(norm(bookTitle));
  const b = stripArticle(norm(candidate));
  const am = stripArticle(norm(mainTitle(bookTitle)));
  const bm = stripArticle(norm(mainTitle(candidate)));
  if (strict) return (a === b || am === bm) && am.split(" ").length >= 3;
  return similarity(a, b) >= 0.9 || (similarity(am, bm) >= 0.92 && am.split(" ").length >= 2);
}

const nameTokens = (s) => norm(s).split(" ").filter((t) => t.length >= 4 && !HONORIFICS.has(t));
function authorMatches(bookAuthor, candidates) {
  const mine = nameTokens(bookAuthor);
  const theirs = nameTokens((candidates ?? []).join(" "));
  return mine.some((x) => theirs.some((y) => similarity(x, y) >= 0.8));
}

function accept(book, title, authors) {
  if (book.author) {
    if (!authorMatches(book.author, authors)) return false;
    // Same author: also accept when our title starts with theirs (they store the subtitle separately).
    const ours = stripArticle(norm(book.title));
    const theirs = stripArticle(norm(title));
    return titleMatches(book.title, title, false) || (theirs.length >= 4 && ours.startsWith(theirs + " ")) || ours === theirs;
  }
  return titleMatches(book.title, title, true);
}

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
    // zoom=1 + fife=w600 gives a 300px-wide cover; other sizes return a "no image" picture.
    const big = `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1&fife=w600&source=gbs_api`;
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
    const out = path.join(OUT_IMG, outName);
    const info = await sharp(buf)
      .resize({ width: 520, height: 780, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out);
    // A tiny greyscale "fingerprint" to spot duplicate scans of the same image.
    const sig = await sharp(out).resize(12, 18, { fit: "fill" }).greyscale().raw().toBuffer();
    return { src: `/covers/${outName}`, width: info.width, height: info.height, sig };
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
      if (dupe) await fs.rm(path.join(ROOT, "public", img.src));
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
