// Everything the site knows about the books comes from data/books.json,
// which is produced by scripts/clean_catalog.py from the original spreadsheet.
import rawBooks from "@data/books.json";
import rawCovers from "@data/covers.json";
import rawDescriptions from "@data/descriptions.json";
import { categoryDescriptions, FEATURED_CATEGORIES, MORE_TO_EXPLORE } from "./categoryInfo";
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

/** Books shown on the website (books marked "removed" are hidden). */
export const books: Book[] = (rawBooks as Book[]).filter((b) => !b.removed);

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
