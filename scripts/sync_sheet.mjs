#!/usr/bin/env node
/**
 * Sync the website with the librarian's Google Sheet (the "source of truth").
 *
 *   npm run sync-sheet                               read the sheet, back it up, rebuild the site's data
 *   npm run sync-sheet -- --write-back --dry-run     also SHOW what would be written into the sheet
 *   npm run sync-sheet -- --write-back               also WRITE it (empty cells only)
 *
 * What it does:
 *  1. Reads the "Cataloged Books" tab with a Google service account
 *     (key file: private/google-service-account.json, never committed).
 *  2. Saves a full backup of the tab in private/sheet/backups/ before anything else.
 *  3. Gives every book a fixed Website ID (column "Website ID"). The very first time, the ID is the
 *     book's position in the list, which matches the website's existing book links. Books added
 *     later get the next free number. IDs never change after that, even if rows are moved.
 *  4. Description edits made in the sheet are used on the website. "Needs Review" = yes hides
 *     that book's description until someone clears it.
 *  5. Rebuilds data/books.json with scripts/clean_catalog.py (the original CSV is not touched).
 *  6. With --write-back, fills the new columns (Website ID, Website Link, Description,
 *     Description Source, Cover Source, Needs Review), but ONLY cells that are empty. It never
 *     changes anything the librarian typed. --dry-run shows the changes without making them.
 */
import { createSign } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY_FILE = join(ROOT, "private/google-service-account.json");
const SHEET_DIR = join(ROOT, "private/sheet");
const SPREADSHEET_ID = "1I3lNcZaAubWvXZXaQkD7j6_QlY73FGdYUWRVxVqZXUU";
const TAB = "Cataloged Books";
const SITE = "https://al-zahra-library.vercel.app";

const args = process.argv.slice(2);
const WRITE_BACK = args.includes("--write-back");
const DRY_RUN = args.includes("--dry-run");

// The librarian's columns, in the order the cleaner expects (found by name, so moving them is fine).
const CORE = [
  ["title"],
  ["author"],
  ["publisher (enter if author not mentioned)", "publisher"],
  ["copies"],
  ["category"],
  ["sub category", "subcategory"],
  ["cateory #", "category #", "cat #"],
  ["sub category #", "sub cat #"],
  ["book number", "book #"],
  [""], // an unnamed column between Book Number and Comments (empty today)
  ["comments"],
];
const NEW_COLUMNS = ["Website ID", "Website Link", "Description", "Description Source", "Cover Source", "Needs Review"];

// ---------- Google sign-in (service account, no extra packages) ----------
async function accessToken(scope) {
  if (!existsSync(KEY_FILE)) throw new Error("Key file not found: private/google-service-account.json");
  const key = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: key.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Google sign-in failed: ${json.error} ${json.error_description ?? ""}`);
  return json.access_token;
}

async function sheetsApi(token, path, init = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const json = await res.json();
  if (json.error) throw new Error(`Google Sheets error ${json.error.code}: ${json.error.message}`);
  return json;
}

const colLetter = (i) => {
  let s = "";
  for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};
const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
const writeJson1 = (rel, data) => writeFileSync(join(ROOT, rel), JSON.stringify(data, null, 1));

async function main() {
  const scope = WRITE_BACK && !DRY_RUN ? "https://www.googleapis.com/auth/spreadsheets" : "https://www.googleapis.com/auth/spreadsheets.readonly";
  const token = await accessToken(scope);

  // 1. Read
  const meta = await sheetsApi(token, "?fields=properties.title");
  const got = await sheetsApi(token, `/values/${encodeURIComponent(TAB)}?valueRenderOption=FORMATTED_VALUE`);
  const values = got.values ?? [];
  const readAt = new Date().toISOString();
  if (values.length < 2) throw new Error(`The "${TAB}" tab looks empty. Stopping.`);

  // 2. Back up
  const stamp = readAt.replace(/[:.]/g, "-");
  mkdirSync(join(SHEET_DIR, "backups"), { recursive: true });
  writeFileSync(join(SHEET_DIR, "backups", `${stamp}-cataloged-books.json`), JSON.stringify({ readAt, tab: TAB, values }));
  console.log(`Read ${values.length - 1} rows from "${meta.properties.title}" → backup saved in private/sheet/backups/`);

  // Find columns by name
  const header = values[0].map((h) => String(h ?? ""));
  const findCol = (names) => header.findIndex((h, i) => names.includes(norm(h)) && (names[0] !== "" || i > 0));
  const core = CORE.map((names, n) => {
    if (names[0] === "") {
      // the unnamed column: the blank-headed column just before "Comments", if there is one
      const c = findCol(["comments"]);
      return c > 0 && norm(header[c - 1]) === "" ? c - 1 : -1;
    }
    return findCol(names);
  });
  for (const [n, i] of core.entries()) if (i < 0 && CORE[n][0] !== "" && n !== 10) throw new Error(`Column "${CORE[n][0]}" not found in the sheet header. Stopping.`);
  const newCol = Object.fromEntries(NEW_COLUMNS.map((name) => [name, header.findIndex((h) => norm(h) === norm(name))]));

  // 3. Fixed Website IDs
  const cell = (row, i) => (i >= 0 ? String(row[i] ?? "") : "");
  const dataRows = values
    .map((row, i) => ({ row, sheetRow: i + 1, position: i }))
    .slice(1)
    .filter(({ row }) => row.some((v) => String(v ?? "").trim() !== ""));
  const idCol = newCol["Website ID"];
  const existing = new Map();
  for (const r of dataRows) {
    const raw = cell(r.row, idCol).trim();
    if (!raw) continue;
    if (!/^\d+$/.test(raw)) throw new Error(`Row ${r.sheetRow}: Website ID "${raw}" is not a number. Please fix it in the sheet.`);
    if (existing.has(raw)) throw new Error(`Website ID ${raw} is used twice (rows ${existing.get(raw)} and ${r.sheetRow}). Please fix it in the sheet.`);
    existing.set(raw, r.sheetRow);
  }
  let next = Math.max(0, ...[...existing.keys()].map(Number)) + 1;
  const firstTime = existing.size === 0;
  for (const r of dataRows) {
    const raw = cell(r.row, idCol).trim();
    r.id = raw ? Number(raw) : firstTime ? r.position : next++;
    r.newId = !raw;
  }
  if (firstTime) console.log("No Website IDs in the sheet yet: using each book's position, which matches the current website links.");
  else if (dataRows.some((r) => r.newId)) console.log(`New books given IDs: ${dataRows.filter((r) => r.newId).map((r) => `row ${r.sheetRow} → ${r.id}`).join(", ")}`);

  // 4. Hand the rows to the cleaner and rebuild data/books.json
  const catalog = {
    title: meta.properties.title,
    tab: TAB,
    readAt,
    header: CORE.map((names, n) => (core[n] >= 0 ? header[core[n]] : names[0])),
    rows: dataRows.map((r) => ({ id: r.id, sheetRow: r.sheetRow, cells: core.map((i) => cell(r.row, i)) })),
  };
  writeFileSync(join(SHEET_DIR, "catalog.json"), JSON.stringify(catalog, null, 1));
  execFileSync("python3", [join(ROOT, "scripts/clean_catalog.py"), "--sheet", join(SHEET_DIR, "catalog.json")], { stdio: "inherit" });
  const books = readJson("data/books.json");
  const bookById = new Map(books.map((b) => [b.id, b]));
  console.log(`Website data rebuilt: ${books.length} books shown.`);

  // 5. Description edits and "Needs Review" from the sheet
  const descriptions = readJson("data/descriptions.json");
  const covers = readJson("data/covers.json");
  const finds = existsSync(join(ROOT, "data/web-finds.json")) ? readJson("data/web-finds.json").books : {};
  const descText = (d) => (d?.paragraphs ?? []).join("\n\n");
  const parseSource = (s) => {
    const url = (s.match(/https?:\/\/\S+/) ?? [""])[0];
    const label = s.replace(url, "").replace(/[\s—–-]+$/, "").trim();
    return { url, label: label || (url ? new URL(url).hostname.replace(/^www\./, "") : "") };
  };
  let edited = 0, hidden = 0;
  for (const r of dataRows) {
    const key = String(r.id);
    const sheetDesc = cell(r.row, newCol["Description"]).trim();
    const review = norm(cell(r.row, newCol["Needs Review"])) === "yes";
    const current = descriptions[key];
    if (sheetDesc && sheetDesc !== descText(current).trim()) {
      const src = parseSource(cell(r.row, newCol["Description Source"]));
      descriptions[key] = {
        paragraphs: sheetDesc.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        source: src.label || "Al-Zahra Library",
        url: src.url || undefined,
        paraphrased: Boolean(src.url),
        origin: "sheet",
      };
      edited++;
    }
    if (descriptions[key] && Boolean(descriptions[key].hidden) !== review) {
      if (review) descriptions[key].hidden = true;
      else delete descriptions[key].hidden;
      hidden += review ? 1 : 0;
    }
  }
  if (edited || hidden) {
    writeJson1("data/descriptions.json", descriptions);
    console.log(`From the sheet: ${edited} description edits used, ${hidden} descriptions newly hidden (Needs Review = yes).`);
  }

  if (!WRITE_BACK) {
    console.log("Done. The sheet was only read. (Add --write-back --dry-run to see what would be filled in.)");
    return;
  }

  // 6. Write back into EMPTY cells only
  const writes = []; // {col, row, value}
  const headerWrites = [];
  // Start after the last column that has ANYTHING in it, header or not (the librarian keeps
  // notes in unnamed columns, e.g. column L), so new columns never land on top of their notes.
  const lastUsed = (row) => row.reduce((last, v, i) => (String(v ?? "").trim() !== "" ? i + 1 : last), 0);
  let nextFree = Math.max(...values.map(lastUsed));
  for (const name of NEW_COLUMNS) {
    if (newCol[name] < 0) {
      newCol[name] = nextFree++;
      headerWrites.push({ col: newCol[name], row: 1, value: name });
    }
  }
  const wanted = (r) => {
    const key = String(r.id);
    const b = bookById.get(r.id);
    const d = descriptions[key];
    const c = covers[key];
    return {
      "Website ID": r.id,
      "Website Link": b ? `${SITE}/books/${b.slug}/` : "",
      Description: d && !d.hidden ? descText(d) : "",
      "Description Source": d && !d.hidden && d.url ? `${d.source} — ${d.url}` : d && !d.hidden ? d.source ?? "" : "",
      "Cover Source": c?.images?.length && c.sourceUrl ? `${c.source} — ${c.sourceUrl}` : "",
      "Needs Review": finds[key]?.needsReview ? "yes" : "",
    };
  };
  for (const r of dataRows) {
    const w = wanted(r);
    for (const name of NEW_COLUMNS) {
      const v = w[name];
      if (v === "" || v === undefined) continue;
      if (cell(r.row, newCol[name]).trim() !== "") continue; // never overwrite
      writes.push({ col: newCol[name], row: r.sheetRow, value: v });
    }
  }

  const perCol = Object.fromEntries(NEW_COLUMNS.map((n) => [n, writes.filter((w) => w.col === newCol[n]).length]));
  console.log(`\n${DRY_RUN ? "DRY RUN: nothing will be written." : "Writing to the sheet."}`);
  for (const h of headerWrites) console.log(`  New column ${colLetter(h.col)}: "${h.value}"`);
  for (const n of NEW_COLUMNS) console.log(`  ${n.padEnd(19)} column ${colLetter(newCol[n])}: ${perCol[n]} empty cells to fill`);
  console.log("  Examples:");
  for (const w of writes.slice(0, 8)) console.log(`    ${colLetter(w.col)}${w.row} = ${String(w.value).slice(0, 90)}`);
  const all = [...headerWrites, ...writes];
  if (DRY_RUN || all.length === 0) {
    console.log(all.length ? "Run again without --dry-run to write these." : "Nothing to fill in.");
    return;
  }

  // Make sure the tab has enough columns, then write in chunks.
  const sheetInfo = await sheetsApi(token, "?fields=sheets.properties");
  const props = sheetInfo.sheets.map((s) => s.properties).find((p) => p.title === TAB);
  const needCols = Math.max(...all.map((w) => w.col)) + 1;
  if (needCols > props.gridProperties.columnCount) {
    await sheetsApi(token, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ appendDimension: { sheetId: props.sheetId, dimension: "COLUMNS", length: needCols - props.gridProperties.columnCount } }] }),
    });
  }
  const q = (s) => `'${TAB.replace(/'/g, "''")}'`;
  for (let i = 0; i < all.length; i += 500) {
    const data = all.slice(i, i + 500).map((w) => ({ range: `${q()}!${colLetter(w.col)}${w.row}`, values: [[w.value]] }));
    await sheetsApi(token, "/values:batchUpdate", { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data }) });
  }
  console.log(`Wrote ${all.length} cells. A backup of the sheet from before this run is in private/sheet/backups/${stamp}-cataloged-books.json`);
}

main().catch((e) => {
  console.error(`\nStopped: ${e.message}`);
  process.exit(1);
});
