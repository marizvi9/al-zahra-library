// Everything the site knows about the books comes from data/books.json,
// which is produced by scripts/clean_catalog.py from the original spreadsheet.
import rawBooks from "@data/books.json";
import rawCovers from "@data/covers.json";
import { categoryDescriptions } from "./categoryInfo";
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

export type CoverImage = { src: string; width: number; height: number };
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
    { ...c, images: c.images.map((img) => ({ ...img, src: withBase(img.src) })) },
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

  // Numbered shelves first (100, 200 …), then the rest, "Uncategorised" last.
  return categories.sort(
    (a, b) =>
      Number(a.name === "Uncategorised") - Number(b.name === "Uncategorised") ||
      Number(a.number ?? 99999) - Number(b.number ?? 99999) ||
      collator.compare(a.name, b.name),
  );
}

export const categories = buildCategories();

export const featuredCategories = [...categories]
  .filter((c) => c.number)
  .sort((a, b) => b.count - a.count)
  .slice(0, 6);

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export const getBook = (slug: string) => books.find((b) => b.slug === slug);

export const booksInCategory = (catSlug: string) =>
  books.filter((b) => b.categorySlug === catSlug).sort(byShelfThenTitle);

export const booksInSubCategory = (catSlug: string, subSlug: string) =>
  booksInCategory(catSlug).filter((b) => b.subCategorySlug === subSlug);

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
  thumb: getThumb(b.id)?.src,
  available: b.available,
});
