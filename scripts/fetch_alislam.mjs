// Looks for books on al-islam.org and, when one is certainly the same book, saves
//   - a short description (their own summary, REWRITTEN later by a person/assistant, never pasted as is), and
//   - the cover picture, unless it is al-islam.org's generic drawn cover (dark band with the author, "Al-Islam.org" badge).
//
// Gentle by design: al-islam.org's robots.txt asks for Crawl-delay: 10, so there is one request every 10+ seconds;
// /search/ (disallowed) is never used. Book addresses on the site look like  /<title-words>-<author-name>, so this
// guesses a few addresses per book and keeps a page only if its title AND author agree with ours (scripts/lib/match.mjs).
//
// Output (nothing in data/ is overwritten):  .cache/alislam/pages.json   (what each page said)
//                                            .cache/alislam/covers/<id>.jpg
// Run:  node scripts/fetch_alislam.mjs [--limit 20] [--ids 5,9,12]
import fs from "node:fs";
import path from "node:path";
import { accept, norm, nameTokens } from "./lib/match.mjs";

const UA = "AlZahraLibraryCatalog/1.0 (static catalogue site; build script)";
const DELAY_MS = 10500;
const OUT = ".cache/alislam";
const PAGES = path.join(OUT, "pages.json");
fs.mkdirSync(path.join(OUT, "covers"), { recursive: true });

const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const limit = Number(arg("--limit") ?? 1e9);
const onlyIds = arg("--ids")?.split(",");

const books = JSON.parse(fs.readFileSync("data/books.json", "utf8"));
const list = Array.isArray(books) ? books : books.books;
const descriptions = JSON.parse(fs.readFileSync("data/descriptions.json", "utf8"));
const covers = JSON.parse(fs.readFileSync("data/covers.json", "utf8"));
const done = fs.existsSync(PAGES) ? JSON.parse(fs.readFileSync(PAGES, "utf8")) : {};

// Spelling variants (data/search-variants.json): al-islam.org may spell a name differently from the catalogue.
const variants = new Map();
for (const g of JSON.parse(fs.readFileSync("data/search-variants.json", "utf8")).groups) {
  const ws = g.map(norm).filter((w) => w && !w.includes(" "));
  for (const w of ws) variants.set(w, ws);
}
const spellings = (w) => [w, ...(variants.get(w) ?? []).filter((v) => v !== w).slice(0, 3)];

const STOP = new Set("a an as at before but by for from is in into like of off on onto per since than the this that to up via with and or".split(" "));
const slug = (s) =>
  norm(s)
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .join("-");

function candidates(b) {
  const title = b.title.replace(/\s*\(.*?\)\s*/g, " ");
  const mains = [...new Set([title, title.split(/\s[-–:]\s|:\s/)[0]])].map(slug).filter(Boolean);
  const names = nameTokens(b.author ?? "");
  const last = names.at(-1);
  const first = names.length > 1 ? names[0] : null;
  const authors = [];
  for (const l of last ? spellings(last) : []) {
    if (first) for (const f of spellings(first).slice(0, 2)) authors.push(`${f}-${l}`);
    authors.push(l);
  }
  const out = [];
  for (const m of mains.slice(0, 1)) for (const a of [...new Set(authors)]) out.push(`/${m}-${a}`);
  return out.slice(0, 8);
}

let last = 0;
async function get(url, binary = false) {
  const wait = last + DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (res.status === 429 || res.status === 503) {
      await new Promise((r) => setTimeout(r, 60000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) return null;
    return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
  }
  return null;
}

const meta = (html, prop) => {
  const m = new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, "i").exec(html);
  return m ? m[1].replace(/&amp;/g, "&").replace(/&#039;|&#39;/g, "'").replace(/&quot;/g, '"') : null;
};

const missing = new Map(); // author → how many of their books still lack something (look at the busiest authors first)
for (const b of list) if (b.author && (!(String(b.id) in descriptions) || !(String(b.id) in covers))) missing.set(b.author, (missing.get(b.author) ?? 0) + 1);
const todo = list.filter(
  (b) =>
    !b.titleMissing &&
    b.author &&
    (!onlyIds || onlyIds.includes(String(b.id))) &&
    !(String(b.id) in done) &&
    (!(String(b.id) in descriptions) || !(String(b.id) in covers)),
);
todo.sort((x, y) => (missing.get(y.author) ?? 0) - (missing.get(x.author) ?? 0));
console.log(`${todo.length} books to look up`);

let n = 0;
for (const b of todo) {
  if (n++ >= limit) break;
  let hit = null;
  for (const c of candidates(b)) {
    const html = await get("https://al-islam.org" + c);
    if (!html || !/property="og:type" content="article"/.test(html)) continue;
    const title = meta(html, "og:title");
    const authorLink = /href="\/person\/([a-z0-9-]+)"/.exec(html)?.[1]?.replace(/-/g, " ");
    // The address itself ends with the author's name, which is a second check.
    const authors = [authorLink ?? "", c.replace(/^\//, "").replace(/-/g, " ")];
    if (title && accept(b, title, authors)) {
      const cover = /src="(https:\/\/al-islam\.org\/sites\/default\/files\/content-cover\/book-cover-[^"]+)"/.exec(html)?.[1] ?? null;
      hit = { url: "https://al-islam.org" + c, title, summary: meta(html, "description"), cover };
      break;
    }
  }
  if (hit?.cover) {
    const buf = await get(hit.cover, true);
    if (buf) fs.writeFileSync(path.join(OUT, "covers", `${b.id}.jpg`), buf);
  }
  done[b.id] = hit ?? { none: true };
  fs.writeFileSync(PAGES, JSON.stringify(done, null, 1));
  console.log(b.id, hit ? `FOUND ${hit.url}` : "no page", `— ${b.title.slice(0, 50)}`);
}
