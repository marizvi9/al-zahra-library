// Fetch author photos from Wikimedia Commons for the authors listed in data/authors.json.
//
//   node scripts/fetch_author_photos.mjs            # fetch any author that has no photo yet
//   node scripts/fetch_author_photos.mjs --refresh  # look them all up again (re-using photos already downloaded)
//   node scripts/fetch_author_photos.mjs --refresh --redownload  # and download every photo again
//
// How it decides (so the right person and a reusable photo are guaranteed):
//   - Each author's Wikipedia article is chosen BY HAND in data/authors.json
//     ("wikipedia": article title). Nothing is searched for by name.
//   - Only the article's main image is used, only if Wikipedia marks it as free, and only
//     if it is hosted on Wikimedia Commons with a free licence (public domain, CC0, CC BY,
//     CC BY-SA). Anything else is skipped, with the reason written to the file.
//   - A small 240px-wide copy is saved in public/authors/ (for lists and cards), and a large copy
//     of up to 640px wide in public/authors/large/ (for the portrait on the author's own page),
//     never enlarged beyond the original. The original's size is recorded, so low-resolution
//     photos can be spotted ("lowRes": true when the original is under 480px wide).
//   - Names in "neverPhoto" (the Prophet, the Imams, the Ahlul-Bayt, holy figures) are
//     never looked up at all.
//   - The bios in the same file are written by hand and are never touched by this script.
// A review list of photos AND bios is written to data/authors-report.md.

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const FILE = "data/authors.json";
const REPORT = "data/authors-report.md";
const LARGE = 640;
const LOW_RES = 480;
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
    let res;
    try {
      // give up on a request that hangs, instead of waiting forever
      res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
    } catch (e) {
      if (attempt < 3) {
        console.log(`  (no answer; trying again)`);
        await sleep(5000);
        continue;
      }
      throw e;
    }
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
      iiprop: "url|extmetadata|mime|size",
      iiurlwidth: String(LARGE),
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
        creator: strip(meta.Artist?.value).replace(/^(.+?)\1(?= |$)/, "$1") || "Unknown", // Commons sometimes repeats the name
        license,
        licenseUrl: meta.LicenseUrl?.value ?? null,
        imageDescription: strip(meta.ImageDescription?.value).slice(0, 160),
        thumb: ii.thumburl,
        mime: ii.mime,
        originalWidth: ii.width,
        originalHeight: ii.height,
      });
  }
  return out;
}

const exists = (f) => fs.access(f).then(() => true, () => false);
async function sizeOf(webp, slug) {
  const { stdout } = await promisify(execFile)("magick", ["identify", "-format", "%w %h", webp]);
  const [w, h] = stdout.trim().split(" ").map(Number);
  return { photoLarge: `/authors/large/${slug}.webp`, largeWidth: w, largeHeight: h };
}

/** Save the large copy as WebP (smaller files) if ImageMagick is installed, otherwise as it came. */
async function saveLarge(buf, slug, ext) {
  const tmp = path.join(OUT_DIR, "large", `${slug}.src.${ext}`);
  await fs.writeFile(tmp, buf);
  const webp = path.join(OUT_DIR, "large", `${slug}.webp`);
  try {
    await promisify(execFile)("magick", [tmp, "-strip", "-resize", `${LARGE}x>`, "-quality", "82", webp]);
    await fs.rm(tmp);
    const { stdout } = await promisify(execFile)("magick", ["identify", "-format", "%w %h", webp]);
    const [w, h] = stdout.trim().split(" ").map(Number);
    return { photoLarge: `/authors/large/${slug}.webp`, largeWidth: w, largeHeight: h };
  } catch {
    const keepAs = path.join(OUT_DIR, "large", `${slug}.${ext}`);
    await fs.rename(tmp, keepAs);
    return { photoLarge: `/authors/large/${slug}.${ext}`, largeWidth: null, largeHeight: null };
  }
}

const data = JSON.parse(await fs.readFile(FILE, "utf8"));
const never = new Set(data.neverPhoto ?? []);
await fs.mkdir(OUT_DIR, { recursive: true });

await fs.mkdir(path.join(OUT_DIR, "large"), { recursive: true });
const todo = Object.entries(data.authors).filter(
  ([name, e]) => !never.has(name) && e.wikipedia && (refresh || (!e.photo && !e.skipped)),
);
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
    // Commons gives the large copy; the small one is the same address at 240px
    // (or the original itself, if the original is no wider than 640px).
    const small = thumb.includes(`/${LARGE}px-`) ? thumb.replace(`/${LARGE}px-`, "/240px-") : thumb;
    const rel = `authors/${slugify(name)}.${ext}`;
    const largeWebp = path.join(OUT_DIR, "large", `${slugify(name)}.webp`);
    let large;
    if (!process.argv.includes("--redownload") && (await exists(path.join("public", rel))) && (await exists(largeWebp))) {
      large = await sizeOf(largeWebp, slugify(name)); // already downloaded on an earlier run
    } else {
      await fs.writeFile(path.join("public", rel), Buffer.from(await (await get(small)).arrayBuffer()));
      await sleep(800);
      const big = Buffer.from(await (await get(thumb)).arrayBuffer());
      large = await saveLarge(big, slugify(name), ext);
      await sleep(1200);
    }
    Object.assign(entry, keep, {
      photo: `/${rel}`,
      ...large,
      lowRes: keep.originalWidth < LOW_RES,
    });
    console.log(`photo   ${name}: ${r.license}`);
  } catch (e) {
    console.log(`error   ${name}: ${e.message} (run again later to retry)`);
  }
  // save after every author, so an interruption never loses what was done
  await fs.writeFile(FILE, JSON.stringify(data, null, 2) + "\n");
}

await fs.writeFile(FILE, JSON.stringify(data, null, 2) + "\n");

const esc = (t = "") => String(t).replace(/\|/g, "\\|").replace(/\n/g, " ");
const photoRows = Object.entries(data.authors)
  .filter(([n]) => !never.has(n) && (Object.hasOwn(data.authors[n], "photo") || data.authors[n].wikipedia))
  .map(([n, e]) =>
    e.photo
      ? `| ${n} | [${e.wikipedia}](${e.wikipediaUrl}) | ${esc(e.description)} | [${e.license}](${e.source}) | ${esc(e.creator)} | ${e.originalWidth ?? "?"}×${e.originalHeight ?? "?"}${e.lowRes ? " **low-res**" : ""} |`
      : `| ${n} | ${e.wikipediaUrl ? `[${e.wikipedia}](${e.wikipediaUrl})` : (e.wikipedia ?? "—")} | ${esc(e.description)} | — skipped: ${esc(e.skipped ?? "removed by hand")} | | |`,
  );
const bioRows = Object.entries(data.authors)
  .filter(([, e]) => e.bioStatus)
  .map(([n, e]) => `| ${n} | ${e.bioStatus} | ${esc(e.bio ?? e.draftBio ?? "")} | ${(e.bioSources ?? []).map((u, k) => `[${k + 1}](${u})`).join(" ")} |`);
await fs.writeFile(
  REPORT,
  `# Authors — review list (bios and photos)\n\nThe data is \`${FILE}\`. Bios are written by hand; photos are fetched by \`node scripts/fetch_author_photos.mjs\`.\n\n## Bios (shown only on each author's own page)\n\n"verified": written from the linked sources and checked against the books we hold. "from our data only": no bio is shown, only the line built from the catalogue. "needs review": nothing is shown until you approve or write it (a draft may be given).\n\n| Author (as shown) | Status | Bio (or draft) | Sources |\n|---|---|---|---|\n${bioRows.join("\n")}\n\n## Photos\n\nEach photo is the main image of the hand-picked Wikipedia article, from Wikimedia Commons under a free licence. To remove one, set \`"photo": null\` for that author and rebuild.\n\n| Author (as shown) | Wikipedia article | Wikipedia's description | Licence (links to the photo's page) | Creator | Original size |\n|---|---|---|---|---|---|\n${photoRows.join("\n")}\n`,
);
const got = Object.values(data.authors).filter((e) => e.photo).length;
console.log(`\n${got} photos. Review: ${REPORT}`);
