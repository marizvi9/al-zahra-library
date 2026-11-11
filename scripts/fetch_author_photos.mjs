// Fetch author photos from Wikimedia Commons for the authors listed in data/author-photos.json.
//
//   node scripts/fetch_author_photos.mjs            # fetch any author that has no photo yet
//   node scripts/fetch_author_photos.mjs --refresh  # fetch them all again
//
// How it decides (so the right person and a reusable photo are guaranteed):
//   - Each author's Wikipedia article is chosen BY HAND in data/author-photos.json
//     ("wikipedia": article title). Nothing is searched for by name.
//   - Only the article's main image is used, only if Wikipedia marks it as free, and only
//     if it is hosted on Wikimedia Commons with a free licence (public domain, CC0, CC BY,
//     CC BY-SA). Anything else is skipped, with the reason written to the file.
//   - A small 240px-wide copy is saved in public/authors/, with the credit and licence.
//   - Names in "neverPhoto" (the Prophet, the Imams, the Ahlul-Bayt, holy figures) are
//     never looked up at all.
// A review list is written to data/author-photos-report.md.

import fs from "node:fs/promises";
import path from "node:path";

const FILE = "data/author-photos.json";
const REPORT = "data/author-photos-report.md";
const OUT_DIR = "public/authors";
const UA = "AlZahraLibraryCatalog/1.0 (static catalogue site; build script)";
const FREE = /^(cc0|cc[ -]by(-sa)?[ -][\d.]+|public domain|pd\b|pd-)/i;
const refresh = process.argv.includes("--refresh");

const slugify = (s) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const strip = (html = "") =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Asks politely: one request at a time, and waits and retries if told to slow down (429).
async function get(url) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429 && attempt < 5) {
      const wait = Number(res.headers.get("retry-after")) * 1000 || 5000 * 2 ** attempt;
      console.log(`  (asked to slow down; waiting ${Math.round(wait / 1000)} s)`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
    return res;
  }
}
const api = async (host, params) =>
  (await get(`https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params }))).json();

const chunks = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));

/** Look up many articles at once (50 per request). Returns article title -> result. */
async function lookupAll(articles) {
  const out = new Map();
  const pageFor = new Map(); // requested title -> page
  for (const group of chunks(articles, 50)) {
    const wp = await api("en.wikipedia.org", {
      action: "query",
      titles: group.join("|"),
      redirects: "1",
      prop: "pageimages|description",
      piprop: "name",
      pilicense: "free",
    });
    const rename = new Map();
    for (const n of wp.query.normalized ?? []) rename.set(n.from, n.to);
    for (const r of wp.query.redirects ?? []) rename.set(r.from, r.to);
    const byTitle = new Map(wp.query.pages.map((p) => [p.title, p]));
    for (const t of group) {
      let final = t;
      for (let k = 0; k < 3 && rename.has(final); k++) final = rename.get(final);
      pageFor.set(t, byTitle.get(final));
    }
    await sleep(1500);
  }
  const files = [...new Set([...pageFor.values()].filter((p) => p?.pageimage).map((p) => `File:${p.pageimage}`))];
  const fileInfo = new Map();
  for (const group of chunks(files, 50)) {
    const cm = await api("commons.wikimedia.org", {
      action: "query",
      titles: group.join("|"),
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime",
      iiurlwidth: "240",
    });
    const rename = new Map((cm.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const f of cm.query.pages) fileInfo.set(rename.get(f.title) ?? f.title, f);
    await sleep(1500);
  }
  for (const t of articles) {
    const page = pageFor.get(t);
    if (!page || page.missing) {
      out.set(t, { skipped: "no such Wikipedia article" });
      continue;
    }
    const info = { wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`, description: page.description ?? "" };
    if (!page.pageimage) {
      out.set(t, { ...info, skipped: "the article has no free main image" });
      continue;
    }
    const file = fileInfo.get(`File:${page.pageimage}`) ?? fileInfo.get(`File:${page.pageimage.replace(/_/g, " ")}`);
    if (!file || file.missing || !file.imageinfo) {
      out.set(t, { ...info, skipped: "image is not on Wikimedia Commons" });
      continue;
    }
    const ii = file.imageinfo[0];
    const meta = ii.extmetadata ?? {};
    const license = strip(meta.LicenseShortName?.value);
    if (!FREE.test(license)) out.set(t, { ...info, skipped: `licence not accepted: ${license || "none given"}` });
    else if (!/^image\/(jpeg|png|webp)$/.test(ii.mime)) out.set(t, { ...info, skipped: `not a photo file (${ii.mime})` });
    else
      out.set(t, {
        ...info,
        file: file.title,
        source: ii.descriptionurl,
        creator: strip(meta.Artist?.value).replace(/^(.+?)\1$/, "$1") || "Unknown", // Commons sometimes repeats the name
        license,
        licenseUrl: meta.LicenseUrl?.value ?? null,
        imageDescription: strip(meta.ImageDescription?.value).slice(0, 160),
        thumb: ii.thumburl,
        mime: ii.mime,
      });
  }
  return out;
}

const data = JSON.parse(await fs.readFile(FILE, "utf8"));
const never = new Set(data.neverPhoto ?? []);
await fs.mkdir(OUT_DIR, { recursive: true });

for (const name of Object.keys(data.authors)) {
  if (never.has(name)) {
    console.log(`never   ${name}`);
    delete data.authors[name];
  }
}
const todo = Object.entries(data.authors).filter(([, e]) => e.wikipedia && (refresh || (!e.photo && !e.skipped)));
const results = await lookupAll([...new Set(todo.map(([, e]) => e.wikipedia))]);

for (const [name, entry] of todo) {
  const r = results.get(entry.wikipedia);
  const { thumb, mime, ...keep } = r;
  delete entry.skipped;
  if (r.skipped) {
    Object.assign(entry, keep, { photo: null });
    console.log(`skip    ${name}: ${r.skipped}`);
    continue;
  }
  try {
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const img = await get(thumb);
    const rel = `authors/${slugify(name)}.${ext}`;
    await fs.writeFile(path.join("public", rel), Buffer.from(await img.arrayBuffer()));
    Object.assign(entry, keep, { photo: `/${rel}` });
    console.log(`photo   ${name}: ${r.license}`);
  } catch (e) {
    console.log(`error   ${name}: ${e.message} (run again later to retry)`);
  }
  await sleep(1200);
}

await fs.writeFile(FILE, JSON.stringify(data, null, 2) + "\n");

const rows = Object.entries(data.authors).map(([n, e]) =>
  e.photo
    ? `| ${n} | [${e.wikipedia}](${e.wikipediaUrl}) | ${e.description} | [${e.license}](${e.source}) | ${e.creator} |`
    : `| ${n} | ${e.wikipediaUrl ? `[${e.wikipedia}](${e.wikipediaUrl})` : (e.wikipedia ?? "—")} | ${e.description ?? ""} | — skipped: ${e.skipped ?? "removed by hand"} | |`,
);
await fs.writeFile(
  REPORT,
  `# Author photos — review list\n\nMade by \`node scripts/fetch_author_photos.mjs\`. Each photo is the main image of the hand-picked Wikipedia article, from Wikimedia Commons under a free licence.\nTo remove a photo, delete the author's entry in \`${FILE}\` (or set \`"photo": null\`) and rebuild.\n\n| Author (as shown) | Wikipedia article | Wikipedia's description | Licence (links to the photo's page) | Creator |\n|---|---|---|---|---|\n${rows.join("\n")}\n`,
);
const got = Object.values(data.authors).filter((e) => e.photo).length;
console.log(`\n${got} photos, ${Object.keys(data.authors).length - got} skipped. Review: ${REPORT}`);
