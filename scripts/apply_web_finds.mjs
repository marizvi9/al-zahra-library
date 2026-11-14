// Puts the covers and descriptions from data/web-finds.json onto the site.
//   - Descriptions (our own wording) go into data/descriptions.json, marked "paraphrased".
//   - Covers are downloaded ONCE and saved in public/covers/ in three sizes (list thumbnail, book page,
//     enlarged view), so the site never depends on another website staying online; data/covers.json
//     records where each came from.
//   - Anything marked needsReview (on the book, the description or the cover) is left off the site.
//   - Entries this script added before are refreshed; entries from the older scripts are never overwritten.
// Run: node scripts/apply_web_finds.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const UA = "AlZahraLibraryCatalog/1.0 (static catalogue site; build script)";
const read = async (f) => JSON.parse(await fs.readFile(path.join(ROOT, f), "utf8"));
const finds = (await read("data/web-finds.json")).books;
const descriptions = await read("data/descriptions.json");
const covers = await read("data/covers.json");
const rawBooks = await read("data/books.json");
const books = new Map((Array.isArray(rawBooks) ? rawBooks : rawBooks.books).map((b) => [String(b.id), b]));

async function saveCover(id, url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`cover download failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const base = `${id}-web`;
  const save = async (name, width, height, quality) => {
    const info = await sharp(buf).resize({ width, height, fit: "inside", withoutEnlargement: true }).webp({ quality }).toFile(path.join(ROOT, "public/covers", name));
    return { width: info.width, height: info.height };
  };
  await save(`${base}-thumb.webp`, 96, 144, 72);
  const md = await save(`${base}.webp`, 520, 780, 80);
  const lg = await save(`${base}-lg.webp`, 1400, 2100, 82);
  return { src: `/covers/${base}.webp`, width: md.width, height: md.height, thumb: `/covers/${base}-thumb.webp`, large: `/covers/${base}-lg.webp`, largeWidth: lg.width, largeHeight: lg.height };
}

let nd = 0, nc = 0, held = 0;
for (const [id, f] of Object.entries(finds)) {
  const book = books.get(id);
  if (!book) { console.log(`! ${id}: no such book`); continue; }
  if (f.needsReview) { held++; continue; }

  const d = f.description;
  if (d?.text?.length && !d.needsReview && (!descriptions[id] || descriptions[id].origin === "web")) {
    descriptions[id] = { paragraphs: d.text, source: d.source, url: d.url, matchedTitle: book.title, matchedAuthor: book.author ?? "", confidence: d.confidence, paraphrased: true, origin: "web" };
    nd++;
  }

  const c = f.cover;
  if (c?.imageUrl && !c.needsReview && (!covers[id] || covers[id].origin === "web")) {
    try {
      const img = await saveCover(id, c.imageUrl);
      covers[id] = { source: c.source, sourceUrl: c.sourceUrl, matchedTitle: book.title, matchedAuthor: book.author ?? "", images: [img], confidence: c.confidence, origin: "web" };
      nc++;
    } catch (e) {
      console.log(`! ${id}: ${e.message}`);
    }
  }
}
await fs.writeFile(path.join(ROOT, "data/descriptions.json"), JSON.stringify(descriptions, null, 1));
await fs.writeFile(path.join(ROOT, "data/covers.json"), JSON.stringify(covers, null, 1));
console.log(`${nd} descriptions and ${nc} covers applied; ${held} books held back for review.`);
