// A small, fast search that runs entirely in the visitor's browser.
// With ~800 books and ~400 authors there is no need for a search server.
//
// What it forgives (so "Mohammed al-Sadr", "muhamad alsadr" and "Muhammad Baqir as-Sadr" all work):
//  - capitals, accents (ā ī ū), apostrophes and signs like ʿ ʾ, hyphens and spaces ("Al-Zahra" = "AlZahra" = "Al Zahra");
//  - doubled letters and common transliteration habits (Hussain = Husain = Husayn = Hussein, o/u, q/k ...);
//  - the spelling variants listed in data/search-variants.json (Muhammad / Mohammad / Mohammed, Quran / Koran ...);
//  - small typos in words of 4+ letters, but only when there are few exact matches, so they never crowd out real hits.
// Ranking: exact words first, then spelling variants, then typo matches; a title or name that is, or begins
// with, what you typed comes before one that merely contains it.

import variantData from "@data/search-variants.json";

// ---------- What the search is given ----------

export type SearchRecord = {
  slug: string;
  title: string;
  credit: string;
  creditParts?: { text: string; slug?: string }[];
  category: string;
  categorySlug: string;
  subCategory: string;
  callNumber: string | null;
  thumb?: string;
  available?: boolean;
};

/** An author, as the search sees them (photo details are only what the round badge needs). */
export type AuthorRecord = {
  slug: string;
  name: string;
  count: number;
  /** Every other way the catalogue spells this person's name. */
  spellings: string[];
  initials: string;
  photo?: {
    src: string;
    title?: string;
    focus?: { x: number; y: number; zoom?: number };
    originalWidth?: number | null;
    originalHeight?: number | null;
  } | null;
};

/** The one file the browser downloads (/search-index.json). */
export type SearchData = { books: SearchRecord[]; authors: AuthorRecord[] };

export type SearchScope = "all" | "title" | "author" | "category";

// ---------- Making spellings comparable ----------

/** Lower-case, accents removed (Kitāb → kitab), apostrophes removed (Shi'a → shia), punctuation → spaces. */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’`ʿʾ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// Each listed variant → the group's main spelling (data/search-variants.json).
const canon = new Map<string, string>();
const variantPairs: [string, string][] = []; // [variant, main], for matching half-typed words
for (const group of (variantData as { groups: string[][] }).groups) {
  const norm = group.map(normalize).filter((w) => w && !w.includes(" "));
  const main = norm[0];
  for (const v of norm) {
    if (!canon.has(v)) canon.set(v, main);
    variantPairs.push([v, main]);
  }
}

/**
 * One word, reduced to a "sounds-alike" form: listed variants first, then general habits of
 * transliteration (double letters, o/u, e/a, q/k, ay/ey/ei/ai, final y/h).
 */
export function fold(word: string): string {
  let w = canon.get(word) ?? word;
  if (!/^[a-z]+$/.test(w)) return w; // numbers and non-Latin scripts are left as they are
  w = w
    .replace(/ou|oo/g, "u")
    .replace(/(.)\1+/g, "$1")
    .replace(/q/g, "k")
    .replace(/o/g, "u")
    .replace(/[ae]y|[ae]i/g, "ai")
    .replace(/e/g, "a")
    .replace(/y$/, "i")
    .replace(/([aiu])h$/, "$1");
  return w.replace(/(.)\1+/g, "$1");
}

type Field = {
  /** Words as typed (normalized), with a leading space for whole-word matching of phrases. */
  norm: string;
  toks: string[];
  /** The same words, folded. */
  fnorm: string;
  ftoks: string[];
  /** All words run together, for "alzahra" vs "al zahra". */
  sq: string;
  fsq: string;
};

function field(text: string): Field {
  const toks = normalize(text).split(" ").filter(Boolean);
  const ftoks = toks.map(fold);
  return { norm: toks.join(" "), toks, fnorm: ftoks.join(" "), ftoks, sq: toks.join(""), fsq: ftoks.join("") };
}

// ---------- Typos ----------

/** Edit distance counting a swapped pair of neighbours (teh → the) as one slip. */
function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const prev2: number[] = [];
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < best) best = v;
    }
    if (best > limit) return limit + 1;
    prev2.splice(0, prev2.length, ...prev);
    prev = cur;
  }
  return prev[b.length];
}

/** Is this folded word a slip or two away from the folded word in the text (or the start of it, for half-typed words)? */
function nearlyEqual(q: string, tok: string): boolean {
  if (q.length < 4 || /\d/.test(q) || q[0] !== tok[0]) return false; // a typo rarely changes the first letter
  const limit = q.length >= 8 ? 2 : 1;
  if (distance(q, tok, limit) <= limit) return true;
  if (tok.length > q.length + 1) {
    // a half-typed word: compare with the same number of starting letters
    for (const n of [q.length - 1, q.length, q.length + 1]) if (n >= 4 && distance(q, tok.slice(0, n), limit) <= limit) return true;
  }
  return false;
}

// ---------- Matching one field ----------

type QueryWord = {
  raw: string;
  /** Folded forms worth looking for: the word itself, its variant, and variants it could be the start of. */
  folded: string[];
};

function queryWord(raw: string): QueryWord {
  const folded = new Set([fold(raw)]);
  if (raw.length >= 3) for (const [v, main] of variantPairs) if (v.startsWith(raw)) folded.add(fold(main));
  return { raw, folded: [...folded] };
}

/** 10 exact word, 8 start of a word, 7 / 6 same for spelling variants, 0 no match. */
function wordTier(q: QueryWord, f: Field): number {
  let best = 0;
  for (let i = 0; i < f.toks.length; i++) {
    const t = f.toks[i];
    if (t === q.raw) return 10;
    if (t.startsWith(q.raw)) best = Math.max(best, 8);
    else if (best < 7) {
      const ft = f.ftoks[i];
      for (const fq of q.folded) {
        if (ft === fq) best = Math.max(best, 7);
        else if (fq.length >= 2 && ft.startsWith(fq)) best = Math.max(best, 6);
      }
    }
  }
  return best;
}

function fuzzyTier(q: QueryWord, f: Field): number {
  // single words, and neighbouring words run together ("alzahra" ~ "az zahra")
  const cands = [...f.ftoks, ...f.ftoks.slice(1).map((t, i) => f.ftoks[i] + t)];
  for (const ft of cands) for (const fq of q.folded) if (nearlyEqual(fq, ft)) return 2;
  return 0;
}

/** Extra points when the whole title/name is, begins with, or contains what was typed. */
function phraseBonus(qNorm: string, qFold: string, f: Field): number {
  if (!qNorm) return 0;
  const sp = " " + f.norm;
  const fsp = " " + f.fnorm;
  if (f.norm === qNorm) return 80;
  if (f.norm.startsWith(qNorm)) return 40;
  if (sp.includes(" " + qNorm)) return 20;
  if (f.fnorm === qFold) return 40;
  if (f.fnorm.startsWith(qFold)) return 20;
  if (fsp.includes(" " + qFold)) return 10;
  return 0;
}

type Weighted = { f: Field; w: number };

/** Score a record against the query: 0 = no match. `fuzzy` allows the typo tier. */
function score(fields: Weighted[], words: QueryWord[], qNorm: string, qFold: string, qSq: string, qFsq: string, fuzzy: boolean, titleLike: Field[]): number {
  let total = 0;
  const missing: QueryWord[] = [];
  for (const q of words) {
    let best = 0;
    for (const { f, w } of fields) best = Math.max(best, w * wordTier(q, f));
    if (best === 0) missing.push(q);
    else total += best;
  }
  if (missing.length > 0) {
    // Words run together or split differently ("alzahra" / "al zahra")?
    if (qSq.length >= 4 && fields.some(({ f }) => f.sq.includes(qSq) || f.fsq.includes(qFsq))) {
      const w = Math.max(...fields.filter(({ f }) => f.sq.includes(qSq) || f.fsq.includes(qFsq)).map(({ w }) => w));
      total = w * 5 * words.length;
    } else if (fuzzy) {
      for (const q of missing) {
        let best = 0;
        for (const { f, w } of fields) best = Math.max(best, w * fuzzyTier(q, f));
        if (best === 0) return 0;
        total += best;
      }
      total = Math.min(total, 25); // typo matches always rank below real ones
    } else return 0;
  }
  let bonus = 0;
  for (const f of titleLike) bonus = Math.max(bonus, phraseBonus(qNorm, qFold, f));
  return total + bonus;
}

function prepare(query: string) {
  const norm = normalize(query);
  const rawWords = norm.split(" ").filter(Boolean);
  const words = rawWords.map(queryWord);
  return {
    words,
    qNorm: rawWords.join(" "),
    qFold: rawWords.map(fold).join(" "),
    qSq: rawWords.join(""),
    qFsq: rawWords.map(fold).join(""),
  };
}

/** Below this many exact matches, typo matches are added after them. */
const FEW = 5;

// ---------- Books ----------

export type Indexed = SearchRecord & { _t: Field; _a: Field; _c: Field };

export function buildIndex(records: SearchRecord[]): Indexed[] {
  return records.map((r) => ({
    ...r,
    _t: field(r.title),
    _a: field(r.credit),
    _c: field(`${r.category} ${r.subCategory} ${r.callNumber ?? ""}`),
  }));
}

function scoreBooks(index: Indexed[], query: string, scope: SearchScope, fuzzy: boolean) {
  const p = prepare(query);
  if (p.words.length === 0) return [];
  const out: { r: Indexed; s: number }[] = [];
  for (const r of index) {
    const fields: Weighted[] = [];
    if (scope === "all" || scope === "title") fields.push({ f: r._t, w: 3 });
    if (scope === "all" || scope === "author") fields.push({ f: r._a, w: 2 });
    if (scope === "all" || scope === "category") fields.push({ f: r._c, w: 1 });
    const s = score(fields, p.words, p.qNorm, p.qFold, p.qSq, p.qFsq, fuzzy, scope === "author" ? [r._a] : scope === "category" ? [] : [r._t]);
    if (s > 0) out.push({ r, s });
  }
  return out;
}

const byScore = <T extends { s: number }>(title: (x: T) => string) => (x: T, y: T) => y.s - x.s || title(x).localeCompare(title(y));

/** Books matching the search, best first. Typo matches are added after the exact ones when there are few. */
export function search(index: Indexed[], query: string, scope: SearchScope): SearchRecord[] {
  const strict = scoreBooks(index, query, scope, false).sort(byScore((x) => x.r.title));
  if (strict.length >= FEW) return strict.map(({ r }) => r);
  const have = new Set(strict.map(({ r }) => r.slug));
  const typos = scoreBooks(index, query, scope, true)
    .filter(({ r }) => !have.has(r.slug))
    .sort(byScore((x) => x.r.title));
  return [...strict, ...typos].map(({ r }) => r);
}

// ---------- Authors ----------

export type IndexedAuthor = AuthorRecord & { _n: Field; _s: Field };

export function buildAuthorIndex(authors: AuthorRecord[]): IndexedAuthor[] {
  return authors.map((a) => ({ ...a, _n: field(a.name), _s: field(a.spellings.join(" ")) }));
}

function scoreAuthors(index: IndexedAuthor[], query: string, fuzzy: boolean) {
  const p = prepare(query);
  if (p.words.length === 0) return [];
  const out: { r: IndexedAuthor; s: number }[] = [];
  for (const r of index) {
    const s = score([{ f: r._n, w: 5 }, { f: r._s, w: 3 }], p.words, p.qNorm, p.qFold, p.qSq, p.qFsq, fuzzy, [r._n, r._s]);
    if (s > 0) out.push({ r, s });
  }
  return out;
}

/** Authors whose name (or any spelling of it) matches, best first; people with more books win ties. */
export function searchAuthors(index: IndexedAuthor[], query: string): AuthorRecord[] {
  const order = (x: { r: IndexedAuthor; s: number }, y: { r: IndexedAuthor; s: number }) => y.s - x.s || y.r.count - x.r.count || x.r.name.localeCompare(y.r.name);
  const strict = scoreAuthors(index, query, false).sort(order);
  if (strict.length >= FEW) return strict.map(({ r }) => r);
  const have = new Set(strict.map(({ r }) => r.slug));
  const typos = scoreAuthors(index, query, true)
    .filter(({ r }) => !have.has(r.slug))
    .sort(order);
  return [...strict, ...typos].map(({ r }) => r);
}

// ---------- Quick suggestions, and filtering a list in place ----------

/** Quick book suggestions while typing. */
export function suggest(index: Indexed[], query: string, limit = 7): SearchRecord[] {
  if (normalize(query).replace(/ /g, "").length < 2) return [];
  return search(index, query, "all").slice(0, limit);
}

/** Which books match, for filtering a list in place (keeps the list's own order). */
export function matchingSlugs(index: Indexed[], query: string): Set<string> {
  return new Set(search(index, query, "all").map((r) => r.slug));
}

// ---------- Telling the visitor which spellings were included ----------

/** For each typed word that has listed variants: the word and its other spellings (e.g. Mohammed → Muhammad, Mohammad…). */
export function variantsIncluded(query: string): { typed: string; also: string[] }[] {
  const seen = new Set<string>();
  const out: { typed: string; also: string[] }[] = [];
  for (const w of normalize(query).split(" ").filter(Boolean)) {
    const main = canon.get(w);
    if (!main || seen.has(main)) continue;
    seen.add(main);
    const also = [...new Set(variantPairs.filter(([, m]) => m === main).map(([v]) => v))].filter((v) => v !== w);
    if (also.length) out.push({ typed: w, also: also.slice(0, 6) });
  }
  return out;
}
