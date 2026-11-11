// The books in the home page slider.
//   Which books:        data/featured-slider-books.json   (edit this to swap a book)
//   Their descriptions: data/descriptions.json            (made by scripts/fetch_descriptions.mjs
//                                                           - copied from Google Books / Open Library)
// The build stops with a clear message if a chosen book is missing an author,
// cover or description, so a half-filled slide can never go live. (A publisher is
// no longer required: only one book with a publisher has a real description.)
import config from "@data/featured-slider-books.json";
import { books, creditParts, getCover, getDescription, shortDescription, type CreditPart } from "./catalog";

export type FeaturedSlide = {
  slug: string;
  title: string;
  author: string;
  creditParts: CreditPart[];
  category: string;
  description: string;
  descriptionSource: string;
  cover: { src: string; width: number; height: number };
};

export const featuredSlides: FeaturedSlide[] = config.books.map(({ id }) => {
  const book = books.find((b) => b.id === id);
  const fail = (why: string): never => {
    throw new Error(`Home page slider: book ${id}${book ? ` ("${book.title}")` : ""} ${why}. Edit data/featured-slider-books.json.`);
  };
  if (!book) return fail("is not in the catalog");
  if (!book.author) fail("has no author");
  const cover = getCover(id)?.images[0];
  if (!cover) return fail("has no cover image");
  const found = getDescription(id);
  if (!found) return fail("has no description (run: node scripts/fetch_descriptions.mjs)");
  const description = shortDescription(found);
  return {
    slug: book.slug,
    title: book.title,
    author: book.author!,
    creditParts: creditParts(book),
    category: book.category,
    description,
    descriptionSource: found.source,
    cover: { src: cover.src, width: cover.width, height: cover.height },
  };
});
