// Saves the library's drawn covers as image files, for books with no real cover picture.
// The site itself draws these covers live (src/components/ArchCover.tsx); the files are our own permanent
// copies for the Google Sheet's "Cover URL" column. Each file is cut from the built book page, so it is
// exactly what the website shows (with the author's photo where there is one).
//
// Run after `npm run build`:   node scripts/render_drawn_covers.mjs
// Writes public/covers/drawn/<id>.webp and data/drawn-covers.json ({ id: "/covers/drawn/<id>.webp" }).
// Uses the site's own fonts (copied from .next/static/media into .cache/fonts for the image renderer).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/covers/drawn");
const FONT_DIR = path.join(ROOT, ".cache/fonts");

// The renderer finds fonts through fontconfig, which is read when the image library loads, so set it up
// first and then load sharp.
if (!process.env.FONTCONFIG_FILE) {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  const media = path.join(ROOT, ".next/static/media");
  for (const f of fs.readdirSync(media).filter((f) => f.endsWith(".woff2"))) {
    const fam = execFileSync("fc-scan", ["--format", "%{family[0]}", path.join(media, f)]).toString();
    if (/^(Literata|IBM Plex Sans Arabic)/.test(fam)) fs.copyFileSync(path.join(media, f), path.join(FONT_DIR, f));
  }
  const conf = path.join(FONT_DIR, "fonts.conf");
  fs.writeFileSync(conf, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${FONT_DIR}</dir><cachedir>${FONT_DIR}/cache</cachedir></fontconfig>`);
  execFileSync(process.execPath, [import.meta.filename, ...process.argv.slice(2)], { stdio: "inherit", env: { ...process.env, FONTCONFIG_FILE: conf } });
  process.exit(0);
}

const sharp = (await import("sharp")).default;
const books = JSON.parse(fs.readFileSync(path.join(ROOT, "data/books.json"), "utf8")).filter((b) => !b.removed);
const covers = JSON.parse(fs.readFileSync(path.join(ROOT, "data/covers.json"), "utf8"));
const only = process.argv.slice(2).map(Number).filter(Boolean); // optional: just these book ids
fs.mkdirSync(OUT_DIR, { recursive: true });

const photoCache = new Map();
async function inlinePhotos(svg) {
  for (const m of [...svg.matchAll(/href="(\/authors\/[^"]+)"/g)]) {
    if (!photoCache.has(m[1])) {
      const png = await sharp(path.join(ROOT, "public", m[1])).png().toBuffer();
      photoCache.set(m[1], `data:image/png;base64,${png.toString("base64")}`);
    }
    svg = svg.split(m[0]).join(`href="${photoCache.get(m[1])}"`);
  }
  return svg;
}

const index = {};
let made = 0, missing = 0;
for (const b of books) {
  if (covers[b.id]) continue; // has a real cover
  if (only.length && !only.includes(b.id)) continue;
  const page = path.join(ROOT, "out/books", b.slug, "index.html");
  if (!fs.existsSync(page)) { missing++; continue; }
  const html = fs.readFileSync(page, "utf8");
  const m = html.match(/<svg class="generated-cover[\s\S]*?<\/svg>(?=<\/div>)/);
  if (!m) { console.log(`! ${b.id}: no drawn cover on the page`); missing++; continue; }
  let svg = await inlinePhotos(m[0]);
  svg = svg
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="1526" ')
    .replace(/var\(--font-head\)/g, "Literata")
    .replace(/var\(--font-ui\)/g, "IBM Plex Sans Arabic")
    .replace(/&amp;/g, "&amp;"); // already escaped in the page
  const file = path.join(OUT_DIR, `${b.id}.webp`);
  await sharp(Buffer.from(svg)).resize(520, 763).webp({ quality: 86 }).toFile(file);
  index[b.id] = `/covers/drawn/${b.id}.webp`;
  made++;
}
const idxFile = path.join(ROOT, "data/drawn-covers.json");
const prev = only.length && fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, "utf8")) : {};
fs.writeFileSync(idxFile, JSON.stringify({ ...prev, ...index }, null, 1));
console.log(`${made} drawn covers saved in public/covers/drawn/${missing ? `; ${missing} pages not found` : ""}.`);
