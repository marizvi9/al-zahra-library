// Fetch the Google Books description for each book in the home page slider.
//
//   node scripts/fetch_featured.mjs            -> reads data/featured-slider-books.json,
//                                                 writes data/featured-descriptions.json
//   IDS=89,116 PROBE=1 node scripts/fetch_featured.mjs
//                                              -> just prints what Google has for those
//                                                 book ids (writes nothing)
//
// Rules: descriptions are copied from Google Books, never written by us. A match is
// accepted only if the title AND an author surname agree. If a book has no description,
// it is reported as missing (swap it for another book in the config file).
// The API key is read from .env.local and is never printed or saved.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MAX_CHARS = 300; // "a few lines" on the slide

let KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";
try {
  const env = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  KEY ||= env.match(/^GOOGLE_BOOKS_API_KEY=(.+)$/m)?.[1].trim() ?? "";
  if (!KEY && /^[A-Za-z0-9_-]{30,}$/.test(env.trim())) KEY = env.trim();
} catch {}
if (!KEY) {
  console.error("No Google Books key found in .env.local — cannot fetch descriptions.");
  process.exit(1);
}

const books = JSON.parse(await fs.readFile(path.join(ROOT, "data", "books.json"), "utf8"));
const covers = JSON.parse(await fs.readFile(path.join(ROOT, "data", "covers.json"), "utf8"));
const probe = process.env.PROBE === "1";
const ids = process.env.IDS
  ? process.env.IDS.split(",").map(Number)
  : JSON.parse(await fs.readFile(path.join(ROOT, "data", "featured-slider-books.json"), "utf8")).books.map((b) => b.id);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function gb(pathAndQuery) {
  await sleep(500);
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  const res = await fetch(`https://www.googleapis.com/books/v1/${pathAndQuery}${sep}key=${KEY}`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    console.log(`   (Google answered ${res.status})`);
    return null;
  }
  return res.json();
}

const norm = (s) =>
  (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const WORDS_TO_IGNORE = new Set(["sayed", "syed", "seyyid", "ayatullah", "ayatollah", "allama", "martyr", "prof", "dr", "al", "ash", "ibn", "bin", "sheikh", "shaykh", "mohammad", "muhammad"]);
const surnames = (author) =>
  norm(author)
    .split(" ")
    .filter((w) => w.length > 2 && !WORDS_TO_IGNORE.has(w));

function titleMatches(ours, theirs) {
  const a = norm(ours);
  const b = norm(theirs);
  return a === b || a.startsWith(b) || b.startsWith(a);
}
function authorMatches(ours, theirs = []) {
  const t = norm(theirs.join(" "));
  return surnames(ours).some((w) => t.includes(w));
}

function clean(html) {
  const text = html
    .replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= MAX_CHARS) return text;
  const cut = text.slice(0, MAX_CHARS);
  // end at a sentence if one finishes in the last third, otherwise at a word
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence > MAX_CHARS * 0.6) return cut.slice(0, sentence + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s-]+$/, "") + "…";
}

async function findDescription(book) {
  const tried = new Set();
  const accept = (vol) => {
    const v = vol?.volumeInfo;
    if (!v?.description || tried.has(vol.id)) return null;
    tried.add(vol.id);
    if (!titleMatches(book.title, v.title) || !authorMatches(book.author, v.authors)) return null;
    return { vol, text: v.description };
  };

  // 1. The same Google book the cover came from.
  const cover = covers[String(book.id)];
  const coverId = cover?.source === "Google Books" ? cover.sourceUrl.match(/[?&]id=([^&]+)/)?.[1] : null;
  if (coverId) {
    const hit = accept(await gb(`volumes/${coverId}`));
    if (hit) return hit;
  }
  // 2. Any Google edition of the same title and author that has a description.
  const surname = surnames(book.author).at(-1) ?? "";
  const q = `intitle:"${book.title.replace(/"/g, "")}" inauthor:${surname}`;
  const data = await gb(`volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`);
  for (const item of data?.items ?? []) {
    const hit = accept(item);
    if (hit) return hit;
  }
  return null;
}

const out = {};
for (const id of ids) {
  const book = books.find((b) => b.id === id);
  if (!book) {
    console.log(`#${id}: not in the catalog`);
    continue;
  }
  console.log(`#${id} ${book.title} — ${book.author}`);
  const hit = await findDescription(book);
  if (!hit) {
    console.log("   NO description found on Google Books");
    continue;
  }
  const text = clean(hit.text);
  console.log(`   from "${hit.vol.volumeInfo.title}" (${hit.vol.id}), ${hit.text.length} chars -> ${text.length}`);
  console.log(`   ${text}`);
  out[id] = {
    text,
    source: "Google Books",
    url: `https://books.google.com/books?id=${hit.vol.id}`,
    volumeTitle: hit.vol.volumeInfo.title,
    volumeAuthors: hit.vol.volumeInfo.authors ?? [],
  };
}

if (!probe) {
  await fs.writeFile(path.join(ROOT, "data", "featured-descriptions.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote data/featured-descriptions.json (${Object.keys(out).length} of ${ids.length} books).`);
}
