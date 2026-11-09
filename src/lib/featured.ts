// The books in the home page slider.
//   Which books:        data/featured-slider-books.json   (edit this to swap a book)
//   Their descriptions: data/featured-descriptions.json   (made by scripts/fetch_featured.mjs
//                                                           from Google Books - never hand-written)
// The build stops with a clear message if a chosen book is missing an author,
// publisher, cover or description, so a half-filled slide can never go live.
import config from "@data/featured-slider-books.json";
import descriptions from "@data/featured-descriptions.json";
import { books, getCover } from "./catalog";

export type FeaturedSlide = {
  slug: string;
  title: string;
  author: string;
  category: string;
  description: string;
  cover: { src: string; width: number; height: number };
};

const texts = descriptions as Record<string, { text: string }>;

export const featuredSlides: FeaturedSlide[] = config.books.map(({ id }) => {
  const book = books.find((b) => b.id === id);
  const fail = (why: string): never => {
    throw new Error(`Home page slider: book ${id}${book ? ` ("${book.title}")` : ""} ${why}. Edit data/featured-slider-books.json.`);
  };
  if (!book) return fail("is not in the catalog");
  if (!book.author) fail("has no author");
  if (!book.publisher) fail("has no publisher");
  const cover = getCover(id)?.images[0];
  if (!cover) return fail("has no cover image");
  const description = texts[String(id)]?.text;
  if (!description) return fail("has no Google Books description (run: node scripts/fetch_featured.mjs)");
  return {
    slug: book.slug,
    title: book.title,
    author: book.author!,
    category: book.category,
    description,
    cover: { src: cover.src, width: cover.width, height: cover.height },
  };
});
