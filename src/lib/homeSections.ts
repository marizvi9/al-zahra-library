// The extra featured sections on the home page (below the main slider).
//   Which sections and books: data/home-featured-sections.json  (edit this to change them)
// Same rules as the main slider: every book needs an author, a cover, and a real
// description from Google Books. The build stops with a clear message otherwise.
import config from "@data/home-featured-sections.json";
import { getAuthor, authors, books, getCover, getDescription, shortDescription, slugifyName } from "./catalog";

export type ShelfBook = {
  slug: string;
  title: string;
  author: string;
  description: string;
  cover: { src: string; width: number; height: number };
};
export type HomeSection = {
  id: string;
  placement: "after-slider" | "after-authors";
  type: "author" | "theme";
  heading: string;
  intro: string;
  author?: { name: string; slug: string; count: number };
  books: ShelfBook[];
};

type Raw = (typeof config.sections)[number] & { author?: string; heading?: string; intro?: string };

if (config.sections.length > 4) throw new Error("data/home-featured-sections.json: please keep to 4 sections at most.");

export const homeSections: HomeSection[] = (config.sections as Raw[]).map((s) => {
  const where = `data/home-featured-sections.json, section "${s.id}"`;
  const fail = (why: string): never => {
    throw new Error(`${where}: ${why}`);
  };
  let author: HomeSection["author"];
  if (s.type === "author") {
    const a = getAuthor(slugifyName(s.author ?? "")) ?? authors.find((x) => x.name === s.author);
    if (!a) fail(`no author page for "${s.author}" (use the name as shown on the site)`);
    author = { name: a!.name, slug: a!.slug, count: a!.count };
  } else if (!s.heading) fail("a theme section needs a heading");

  const list = s.books.map((id) => {
    const book = books.find((b) => b.id === id);
    if (!book) return fail(`book ${id} is not in the catalogue`);
    const name = `book ${id} ("${book.title}")`;
    if (!book.author) fail(`${name} has no author`);
    const cover = getCover(id)?.images[0];
    if (!cover) return fail(`${name} has no cover image`);
    const d = getDescription(id);
    if (!d || d.source !== "Google Books") return fail(`${name} has no Google Books description`);
    return {
      slug: book.slug,
      title: book.title,
      author: book.author!,
      description: shortDescription(d, 200),
      cover: { src: cover.src, width: cover.width, height: cover.height },
    };
  });

  return {
    id: s.id,
    placement: s.placement as HomeSection["placement"],
    type: s.type as HomeSection["type"],
    heading: s.type === "author" ? author!.name : s.heading!,
    intro:
      s.type === "author"
        ? `${author!.count} of ${author!.name.split(" ").pop()}'s books are in our library. Here are a few to start with.`
        : (s.intro ?? ""),
    author,
    books: list,
  };
});
