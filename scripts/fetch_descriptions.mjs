// Find a published description for each book, for the book pages and the home page slider.
//
//   node scripts/fetch_descriptions.mjs          (LIMIT=20 to try a few books first)
//
// Where descriptions come from (copied, never written by us):
//   1. Google Books (uses the API key in .env.local, which is never printed or saved).
//   2. Open Library, only for books whose cover already came from the same Open Library work.
// A description is used only if:
//   - the title AND author match (the same strict check as the covers: scripts/lib/match.mjs),
//   - volume numbers don't disagree (Vol. 1 is not Vol. 2),
//   - after removing distributors' standard blurbs, it is at least 80 characters,
//   - it reads as English for English books,
//   - the book's cover wasn't rejected as a wrong match (data/covers-rejected.json).
// Output: data/descriptions.json (used by the site) and data/descriptions-report.md (to check).
// Answers are cached in .cache/covers (shared with the cover script) so re-runs are quick.

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { accept, mainTitle, nameTokens, norm } from "./lib/match.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".cache", "covers");
const UA = "AlZahraLibraryCatalog/1.0 (community library catalogue)";
const MIN_CHARS = 80;

let KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";
try {
  const env = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  KEY ||= env.match(/^GOOGLE_BOOKS_API_KEY=(.+)$/m)?.[1].trim() ?? "";
  if (!KEY && /^[A-Za-z0-9_-]{30,}$/.test(env.trim())) KEY = env.trim();
} catch {}
console.log(KEY ? "Using Google Books with your API key." : "No Google Books key — Open Library only.");
await fs.mkdir(CACHE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastCall = {};
let googleOff = !KEY;
async function cachedJson(url, host, gap, secret = "") {
  const file = path.join(CACHE, crypto.createHash("sha1").update(url).digest("hex") + ".json");
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  if (host === "gb" && googleOff) return null;
  const wait = (lastCall[host] ?? 0) + gap - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall[host] = Date.now();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url + secret, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
      if (res.status === 429 && host === "gb") {
        console.log("Google Books daily limit reached — continuing with what is cached and Open Library.");
        googleOff = true;
        return null;
      }
      if (res.status === 429 || res.status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      await fs.writeFile(file, JSON.stringify(data));
      return data;
    } catch {
      await sleep(3000);
    }
  }
  return null;
}

// ---------- cleaning and checks ----------
const ENTITIES = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">" };
// Distributors' standard blurb ("This book is one of the many Islamic publications distributed by
// Talee / Ahlulbayt Organization / Mustafa Organization ...") says nothing about the book itself.
// It always runs to the end of the text, so everything from its first words onward is removed.
const DISTRIBUTOR_BLURB = /This book is one of the many Islamic publications distributed by[\s\S]*$/i;

function paragraphs(raw) {
  const text = (typeof raw === "string" ? raw : (raw?.value ?? "")).replace(DISTRIBUTOR_BLURB, "");
  return text
    .replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\r/g, "")
    .replace(/\(\[source\]\[\d+\]\)|\[\d+\]: https?:\S+/g, "") // Open Library footnote links
    .split(/\n\s*\n|\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);
}
const numbersIn = (s) => (norm(s).match(/\b\d+\b/g) ?? []).sort().join(",");
const ENGLISH = new Set(["the", "and", "of", "to", "in", "is", "a", "this", "for", "with"]);
const looksEnglish = (text) => norm(text).split(" ").filter((w) => ENGLISH.has(w)).length >= 3;

function usable(book, title, paras) {
  const text = paras.join(" ");
  if (text.length < MIN_CHARS) return "too short";
  const a = numbersIn(book.title);
  const b = numbersIn(title);
  if (a && b && a !== b) return "different volume";
  const english = !["French", "Italian"].includes(book.category);
  if (english && !looksEnglish(text)) return "not English";
  return null;
}

// ---------- sources ----------
async function fromGoogle(book) {
  let q = `intitle:"${mainTitle(book.title)}"`;
  const surname = nameTokens(book.author ?? "").at(-1);
  if (surname) q += ` inauthor:${surname}`;
  // Same URL as the cover script, so its saved answers are reused.
  const base = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`;
  const data = await cachedJson(base, "gb", 1100, KEY ? `&key=${KEY}` : "");
  const items = data?.items ?? [];
  // Prefer the exact Google book the cover came from.
  const coverId = covers[book.id]?.source === "Google Books" ? covers[book.id].sourceUrl.match(/[?&]id=([^&]+)/)?.[1] : null;
  items.sort((x, y) => Number(y.id === coverId) - Number(x.id === coverId));
  let why = "no match";
  for (const item of items) {
    const v = item.volumeInfo ?? {};
    if (!v.description) continue;
    const full = v.subtitle ? `${v.title}: ${v.subtitle}` : v.title;
    if (!(accept(book, full, v.authors) || accept(book, v.title, v.authors))) continue;
    const paras = paragraphs(v.description);
    const problem = usable(book, full, paras);
    if (problem) {
      why = problem;
      continue;
    }
    return {
      found: {
        paragraphs: paras,
        source: "Google Books",
        url: `https://books.google.com/books?id=${item.id}`,
        matchedTitle: full,
        matchedAuthor: (v.authors ?? []).join(", "),
      },
    };
  }
  return { why: data ? why : "no answer" };
}

async function fromOpenLibrary(book) {
  const c = covers[book.id];
  if (c?.source !== "Open Library" || !/\/works\/OL\d+W$/.test(c.sourceUrl)) return { why: "no Open Library work" };
  const work = await cachedJson(`${c.sourceUrl}.json`, "ol", 1100);
  if (!work?.description) return { why: "no description" };
  const paras = paragraphs(work.description);
  const problem = usable(book, work.title ?? c.matchedTitle, paras);
  if (problem) return { why: problem };
  return {
    found: {
      paragraphs: paras,
      source: "Open Library",
      url: c.sourceUrl,
      matchedTitle: work.title ?? c.matchedTitle,
      matchedAuthor: c.matchedAuthor,
    },
  };
}

// ---------- main ----------
const books = JSON.parse(await fs.readFile(path.join(ROOT, "data", "books.json"), "utf8"))
  .filter((b) => !b.removed && !b.titleMissing)
  .slice(0, Number(process.env.LIMIT) || undefined);
const covers = JSON.parse(await fs.readFile(path.join(ROOT, "data", "covers.json"), "utf8"));
let rejected = new Set();
try {
  rejected = new Set(JSON.parse(await fs.readFile(path.join(ROOT, "data", "covers-rejected.json"), "utf8")));
} catch {}

const out = {};
const report = [];
let n = 0;
for (const book of books) {
  n++;
  if (rejected.has(book.id)) {
    report.push(`| ${book.id} | ${book.title} | — | skipped (cover was a wrong match) |`);
    continue;
  }
  const g = await fromGoogle(book);
  const result = g.found ? g : await fromOpenLibrary(book);
  if (result.found) {
    out[book.id] = result.found;
    report.push(`| ${book.id} | ${book.title} | ${result.found.source} | “${result.found.matchedTitle}” — ${result.found.matchedAuthor} |`);
  } else {
    report.push(`| ${book.id} | ${book.title} | — | none (Google: ${g.why}; Open Library: ${result.why}) |`);
  }
  if (n % 25 === 0) console.log(`${n}/${books.length} checked, ${Object.keys(out).length} with descriptions`);
}

await fs.writeFile(path.join(ROOT, "data", "descriptions.json"), JSON.stringify(out, null, 1) + "\n");
const bySource = Object.values(out).reduce((m, d) => ((m[d.source] = (m[d.source] ?? 0) + 1), m), {});
await fs.writeFile(
  path.join(ROOT, "data", "descriptions-report.md"),
  `# Book descriptions\n\n${Object.keys(out).length} of ${books.length} books have a description ` +
    `(${Object.entries(bySource).map(([s, c]) => `${c} from ${s}`).join(", ")}).\n` +
    `Descriptions are copied from the source, never written by hand. To remove a wrong one, add the book id to ` +
    `data/covers-rejected.json (it is skipped next run) or delete its entry from data/descriptions.json.\n\n` +
    `| id | Title | Source | Matched |\n|---|---|---|---|\n${report.join("\n")}\n`,
);
console.log(`Done: ${Object.keys(out).length} of ${books.length} books have a description.`, bySource);
