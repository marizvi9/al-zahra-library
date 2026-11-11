// Everything the site knows about the books comes from data/books.json,
// which is produced by scripts/clean_catalog.py from the original spreadsheet.
import rawBooks from "@data/books.json";
import rawCovers from "@data/covers.json";
import rawDescriptions from "@data/descriptions.json";
import authorNames from "@data/author-names.json";
import { categoryDescriptions, DISPLAY_NAMES, FEATURED_CATEGORIES, MORE_TO_EXPLORE } from "./categoryInfo";
import { withBase } from "./paths";

export type Book = {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  publisher: string | null;
  titleMissing: boolean;
  copies: number;
  copiesAssumed: boolean;
  available: boolean;
  category: string;
  categorySlug: string;
  subCategory: string;
  subCategorySlug: string;
  catNo: string | null;
  subCatNo: string | null;
  bookNo: string | null;
  callNumber: string | null;
  booklet: boolean;
  removed: boolean;
  note: string | null;
  sourceRow: number;
};

export type CoverImage = {
  src: string; // medium size, shown on the book page
  width: number;
  height: number;
  thumb?: string; // tiny, for lists
  large?: string; // biggest available, loaded only in the enlarged view
  largeWidth?: number;
  largeHeight?: number;
};
export type CoverInfo = {
  source: string;
  sourceUrl: string;
  matchedTitle: string;
  matchedAuthor: string;
  images: CoverImage[];
};

// Cover art found by scripts/fetch_covers.mjs, keyed by book id.
// Image paths get the site's base folder added here, once, for everything.
const covers: Record<string, CoverInfo> = Object.fromEntries(
  Object.entries(rawCovers as Record<string, CoverInfo>).map(([id, c]) => [
    id,
    { ...c, images: c.images.map((img) => ({
        ...img,
        src: withBase(img.src),
        thumb: withBase(img.thumb ?? img.src),
        large: withBase(img.large ?? img.src),
        largeWidth: img.largeWidth ?? img.width,
        largeHeight: img.largeHeight ?? img.height,
      })),
    },
  ]),
);
export const getCover = (id: number): CoverInfo | undefined => covers[String(id)];
/** The front cover (first image) for small thumbnails, if we have one. */
export const getThumb = (id: number): CoverImage | undefined => covers[String(id)]?.images[0];

export type SubCategory = {
  name: string;
  slug: string;
  number: string | null;
  count: number;
};

export type Category = {
  name: string;
  slug: string;
  number: string | null;
  description: string;
  count: number;
  subCategories: SubCategory[];
};

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

const shown = (name: string) => DISPLAY_NAMES[name] ?? name;

/** Books shown on the website (books marked "removed" are hidden), with display names applied. */
export const books: Book[] = (rawBooks as Book[])
  .filter((b) => !b.removed)
  .map((b) => ({ ...b, category: shown(b.category), subCategory: shown(b.subCategory) }));

const byShelfThenTitle = (a: Book, b: Book) =>
  Number(a.subCatNo ?? 9999) - Number(b.subCatNo ?? 9999) || collator.compare(a.title, b.title);

function mostCommon(values: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | null = null;
  for (const [v, n] of counts) if (best === null || n > counts.get(best)!) best = v;
  return best;
}

function buildCategories(): Category[] {
  const groups = new Map<string, Book[]>();
  for (const b of books) {
    if (!groups.has(b.categorySlug)) groups.set(b.categorySlug, []);
    groups.get(b.categorySlug)!.push(b);
  }

  const categories = [...groups.values()].map((list): Category => {
    const subs = new Map<string, Book[]>();
    for (const b of list) {
      if (!subs.has(b.subCategorySlug)) subs.set(b.subCategorySlug, []);
      subs.get(b.subCategorySlug)!.push(b);
    }
    const subCategories = [...subs.values()]
      .map((s) => ({
        name: s[0].subCategory,
        slug: s[0].subCategorySlug,
        number: mostCommon(s.map((b) => b.subCatNo)),
        count: s.length,
      }))
      .sort(
        (a, b) =>
          Number(a.name === "General") - Number(b.name === "General") ||
          Number(a.number ?? 9999) - Number(b.number ?? 9999) ||
          collator.compare(a.name, b.name),
      );
    const name = list[0].category;
    return {
      name,
      slug: list[0].categorySlug,
      number: mostCommon(list.map((b) => b.catNo)),
      description: categoryDescriptions[name] ?? "",
      count: list.length,
      subCategories,
    };
  });

  // Numbered shelves first (100, 200 …), then the rest, "Uncategorized" last.
  return categories.sort(
    (a, b) =>
      Number(a.name === "Uncategorized") - Number(b.name === "Uncategorized") ||
      Number(a.number ?? 99999) - Number(b.number ?? 99999) ||
      collator.compare(a.name, b.name),
  );
}

export const categories = buildCategories();

/** Look up categories by name, in the given order. A typo in a name stops the build. */
function pick(names: string[]): Category[] {
  return names.map((name) => {
    const c = categories.find((x) => x.name === name);
    if (!c) throw new Error(`Home page lists a category that doesn't exist: "${name}"`);
    return c;
  });
}

export const featuredCategories = pick(FEATURED_CATEGORIES);
export const moreToExplore = pick(MORE_TO_EXPLORE);

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export const getBook = (slug: string) => books.find((b) => b.slug === slug);

/** All books in one category, in shelf order (Browse by categories). */
export const booksInCategory = (catSlug: string) => books.filter((b) => b.categorySlug === catSlug).sort(byShelfThenTitle);

/** Books in one sub-category (used for "More in …" on book pages). */
export const booksInSubCategory = (catSlug: string, subSlug: string) =>
  books.filter((b) => b.categorySlug === catSlug && b.subCategorySlug === subSlug).sort(byShelfThenTitle);

/** Text in the publisher column that is really a person's credit, e.g. "Compiled by: …". */
const isPersonCredit = (s: string) => /^(compiled|prepared|translated|edited|compiler)\b/i.test(s);

/**
 * One short line naming who wrote or produced the book, for cards and lists.
 * Author if known → otherwise the publisher → otherwise "Unknown".
 */
export function creditLine(b: Pick<Book, "author" | "publisher">): string {
  if (b.author) return b.author;
  if (b.publisher) return isPersonCredit(b.publisher) ? b.publisher : `Published by ${b.publisher}`;
  return "Unknown";
}

/** Label for the publisher row on a book page. */
export const publisherLabel = (publisher: string) => (isPersonCredit(publisher) ? "Credit" : "Publisher");

export const copiesText = (copies: number) => (copies === 1 ? "1 copy" : `${copies} copies`);

/** The small set of fields a book needs to appear in a list. */
export const toListItem = (b: Book) => ({
  slug: b.slug,
  title: b.title,
  credit: creditLine(b),
  creditParts: creditParts(b),
  category: b.category,
  categorySlug: b.categorySlug,
  subCategory: b.subCategory,
  callNumber: b.callNumber,
  thumb: getThumb(b.id)?.thumb,
  available: b.available,
});

// ---------- Shelves (Cat # = shelf, Sub Cat # = section on that shelf) ----------

export type Shelf = {
  slug: string; // "100", "200" … or "none"
  number: string | null;
  label: string; // "100" or "No shelf number"
  categories: string[]; // categories kept on this shelf
  count: number;
};

export type ShelfSection = {
  key: string; // used in the web address, e.g. /shelves/300/#s50
  heading: string;
  description?: string;
  href?: string;
  books: Book[];
};

const NO_SHELF = "none";
const shelfOf = (b: Book) => b.catNo ?? NO_SHELF;
/** Which section of its shelf a book is in: Sub Cat # on numbered shelves, category otherwise. */
const sectionKeyOf = (b: Book) => (b.catNo ? (b.subCatNo ? `s${b.subCatNo}` : "unnumbered") : b.categorySlug);

export const shelves: Shelf[] = (() => {
  const byNo = new Map<string, Book[]>();
  for (const b of books) {
    const key = shelfOf(b);
    if (!byNo.has(key)) byNo.set(key, []);
    byNo.get(key)!.push(b);
  }
  return [...byNo.entries()]
    .sort(([a], [b]) => (a === NO_SHELF ? 1 : b === NO_SHELF ? -1 : Number(a) - Number(b)))
    .map(([key, list]) => ({
      slug: key,
      number: key === NO_SHELF ? null : key,
      label: key === NO_SHELF ? "No number" : key,
      categories: [...new Set(list.map((b) => b.category))],
      count: list.length,
    }));
})();

export const getShelf = (slug: string) => shelves.find((s) => s.slug === slug);

const byTitle = (a: Book, b: Book) => collator.compare(a.title, b.title);

/** Books on one shelf, grouped into sections by Sub Cat # (10, 20 …). */
export function shelfSections(slug: string): ShelfSection[] {
  const list = books.filter((b) => shelfOf(b) === slug).sort(byTitle);

  // Books with no shelf number at all: group them by category, with its description.
  if (slug === NO_SHELF) {
    return categories
      .filter((c) => list.some((b) => b.categorySlug === c.slug))
      .map((c) => ({
        key: c.slug,
        heading: c.name,
        description: c.description,
        books: list.filter((b) => b.categorySlug === c.slug),
      }));
  }

  const sections = new Map<string, Book[]>();
  for (const b of list) {
    const key = sectionKeyOf(b);
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(b);
  }
  const num = (k: string) => (k === "unnumbered" ? Infinity : Number(k.slice(1)));
  return [...sections.entries()]
    .sort(([a], [b]) => num(a) - num(b))
    .map(([key, group]) => ({
      key,
      heading:
        key === "unnumbered"
          ? "No section number recorded"
          : `${slug} · ${key.slice(1)} — ${[...new Set(group.map((b) => b.subCategory))].join(", ")}`,
      books: group,
    }));
}

/** "All shelves": one section per shelf, with its category description. */
export function allShelfSections(): ShelfSection[] {
  return shelves.map((sh) => {
    const cats = categories.filter((c) => sh.categories.includes(c.name));
    return {
      key: `shelf-${sh.slug}`,
      heading: sh.number ? `Shelf ${sh.number} — ${cats.map((c) => c.name).join(", ")}` : "No shelf number",
      description: sh.number ? cats.map((c) => c.description).filter(Boolean).join(" ") : "Books that have not been given a shelf number yet.",
      href: `/shelves/${sh.slug}/`,
      books: books.filter((b) => shelfOf(b) === sh.slug).sort(byTitle),
    };
  });
}

// ---------- Descriptions (from scripts/fetch_descriptions.mjs, never written by hand) ----------

export type Description = {
  paragraphs: string[];
  source: string; // "Google Books" or "Open Library"
  url: string;
  matchedTitle: string;
  matchedAuthor: string;
};

const descriptions = rawDescriptions as Record<string, Description>;
export const getDescription = (id: number): Description | undefined => descriptions[String(id)];

/** The start of a description, cut at a sentence or word, for small spaces like the slider. */
export function shortDescription(d: Description, maxChars = 300): string {
  const text = d.paragraphs.join(" ");
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence > maxChars * 0.6) return cut.slice(0, sentence + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s-]+$/, "") + "…";
}

// ---------- Authors ----------
// Many authors are spelled several ways in the catalogue. data/author-names.json lists,
// for each person, the name to show and every spelling used. Every author has a page at
// /authors/<slug>/. A cell naming several people ("A & B", "A, B and C",
// "X Translated by: Y") is split so each person gets their own link and page.

export type Author = { name: string; slug: string; count: number; books: Book[] };
/** A piece of a credit line: plain text (", ", "Compiled by: ") or a linked author name. */
export type CreditPart = { text: string; slug?: string };

const nameFor = new Map<string, string>(
  Object.entries((authorNames as { groups: Record<string, string[]> }).groups).flatMap(([name, spellings]) =>
    spellings.map((s) => [s, name] as [string, string]),
  ),
);

export const slugifyName = (s: string) => slugify(s);

const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Last word of a name, for sorting A–Z by surname ("Ali Shariati" → "shariati"). */
const surname = (name: string) =>
  name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .pop()!
    .replace(/^(al|as|at|an|ar|ash)-/i, "")
    .toLowerCase();

const ROLE = /^(compiled by:?|compiler:|translated by:?)\s*/i;
const SEPARATOR = /(,\s*and\s+|\s*[,;&]\s*|\s+and\s+|\s+(?=translated by:?\s))/i;
const DEGREE = /^(m\.?\s?d\.?|ph\.?\s?d\.?|phd)$/i;
/** The name shown for an author (spelling variants become one name). */
export const authorName = (raw: string) => nameFor.get(raw) ?? raw;

/**
 * Split a credit cell into plain text and author names, keeping the original wording:
 * "Ali Shariati Translated By: Laleh Bakhtiar and Husayn Salih" →
 * [Ali Shariati] [ Translated By: ] [Laleh Bakhtiar] [ and ] [Husayn Salih].
 */
function splitCredit(raw: string): { text: string; name?: string }[] {
  const one = (cell: string) => {
    const role = ROLE.exec(cell)?.[0] ?? "";
    const rest = cell.slice(role.length);
    const name = nameFor.get(cell) ?? nameFor.get(rest) ?? rest;
    return role ? [{ text: role }, { text: rest, name }] : [{ text: cell, name }];
  };
  if (nameFor.has(raw) || !SEPARATOR.test(raw)) return one(raw);
  const bits = raw.split(SEPARATOR); // names at even positions, separators at odd ones
  const names: string[] = [];
  const seps: string[] = [];
  for (let k = 0; k < bits.length; k++) {
    if (k % 2 === 1) seps.push(bits[k]);
    else if (DEGREE.test(bits[k].trim()) && names.length) names[names.length - 1] += seps.pop() + bits[k]; // "Syed M. Rizvi, M.D."
    else names.push(bits[k]);
  }
  // A one-word piece ("Abbas & Shaheen Merali", "H & T ...") means it isn't really a list: keep it whole.
  if (names.some((n) => n.replace(ROLE, "").trim().split(/\s+/).length < 2)) return one(raw);
  const out: { text: string; name?: string }[] = [];
  names.forEach((n, k) => {
    if (k > 0) out.push({ text: seps[k - 1] });
    out.push(...one(n.trim()));
  });
  return out;
}

/** The people credited on a book (spellings merged), for author pages. */
export const authorsOfBook = (b: Book) => (b.author ? splitCredit(b.author).flatMap((p) => (p.name ? [p.name] : [])) : []);

export const authors: Author[] = (() => {
  const groups = new Map<string, Book[]>();
  for (const b of books) {
    if (b.titleMissing) continue;
    for (const name of new Set(authorsOfBook(b))) {
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push(b);
    }
  }
  const list = [...groups.entries()]
    .map(([name, books]) => ({ name, slug: slugify(name), count: books.length, books: books.sort(byTitle) }))
    .sort((a, b) => collator.compare(surname(a.name), surname(b.name)) || collator.compare(a.name, b.name));
  const seen = new Map<string, string>();
  for (const a of list) {
    if (seen.has(a.slug)) throw new Error(`Two authors share the address /authors/${a.slug}/: "${seen.get(a.slug)}" and "${a.name}". Add one of them to data/author-names.json.`);
    seen.set(a.slug, a.name);
  }
  return list;
})();

const bySlug = new Map(authors.map((a) => [a.slug, a]));
const byName = new Map(authors.map((a) => [a.name, a]));
export const getAuthor = (slug: string) => bySlug.get(slug);

/** A book's credit line in pieces, with each author linked (a publisher shown instead is not linked). */
export function creditParts(b: Pick<Book, "author" | "publisher">): CreditPart[] {
  if (!b.author) return [{ text: creditLine(b) }];
  return splitCredit(b.author).map((p) => (p.name && byName.has(p.name) ? { text: p.text, slug: byName.get(p.name)!.slug } : { text: p.text }));
}

/** The author page for this book's author, when the book has exactly one author. */
export function authorOf(b: Book): Author | undefined {
  const names = authorsOfBook(b);
  return names.length === 1 ? byName.get(names[0]) : undefined;
}

/** Authors with the most books, for the home page. */
export const topAuthors = (n: number) => [...authors].sort((a, b) => b.count - a.count || collator.compare(a.name, b.name)).slice(0, n);

// ---------- Multi-volume sets ----------
// Books whose titles carry a volume or part number ("Vol. 2", "Part II") and share the
// rest of the title. A set is shown only when the library holds 2+ DIFFERENT volumes.

export type BookSet = { title: string; volumes: { label: string; book: Book }[] };

const VOLUME = /\s*[-,:(]?\s*\b(vol\.?|volume|part|pt\.?)\s*([ivx]+|\d+(?:-\d+)?)\b\)?/i;
const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

export const bookSets: BookSet[] = (() => {
  const groups = new Map<string, { n: number; label: string; base: string; book: Book }[]>();
  for (const b of books) {
    if (b.titleMissing) continue;
    const m = VOLUME.exec(b.title);
    if (!m) continue;
    const raw = m[2].toLowerCase();
    const n = /^\d/.test(raw) ? parseInt(raw, 10) : ROMAN[raw];
    if (!n) continue;
    // "Part 2" stays "Part 2"; "Vol. II" / "Volume 3-4" become "Vol. 2" / "Vol. 3–4".
    const label = `${/^p/i.test(m[1]) ? "Part" : "Vol."} ${/^\d/.test(raw) ? raw.replace("-", "–") : n}`;
    const base = b.title.slice(0, m.index).replace(/[\s\-:,(]+$/, "");
    const key = base.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ n, label, base, book: b });
  }
  return [...groups.values()]
    .filter((list) => new Set(list.map((v) => v.n)).size >= 2)
    .map((list) => {
      list.sort((a, b) => a.n - b.n || collator.compare(a.book.title, b.book.title));
      // one entry per volume number (the catalogue sometimes lists the same volume twice)
      const seen = new Set<number>();
      const volumes = list.filter((v) => !seen.has(v.n) && seen.add(v.n)).map((v) => ({ label: v.label, book: v.book }));
      return { title: list[0].base, volumes };
    })
    .sort((a, b) => collator.compare(a.title, b.title));
})();
