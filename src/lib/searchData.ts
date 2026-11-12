// Builds what the search needs (books and authors) from the catalogue. Runs at build time only.
import authorNames from "@data/author-names.json";
import { authors, books, toListItem } from "./catalog";
import { initials, photoFor, viaSuffix } from "./authorPhotos";
import type { AuthorRecord, SearchData, SetRecord } from "./search";
import { getCover } from "./catalog";
import { volumeSets } from "./sets";

const groups = (authorNames as { groups: Record<string, string[]> }).groups;

export function authorRecords(): AuthorRecord[] {
  return authors.map((a) => {
    const p = photoFor(a.name);
    return {
      slug: a.slug,
      name: a.name,
      count: a.count,
      spellings: (groups[a.name] ?? []).filter((s) => s !== a.name),
      initials: initials(a.name),
      photo: p
        ? { src: p.photo, title: `Photo: ${p.creator.length > 60 ? p.creator.slice(0, 57).trimEnd() + "…" : p.creator}, ${p.license}${viaSuffix(p)}`, focus: p.focus, originalWidth: p.originalWidth, originalHeight: p.originalHeight }
        : null,
    };
  });
}

export function setRecords(): SetRecord[] {
  return volumeSets.map((s) => ({
    slug: s.slug,
    name: s.name,
    kind: s.kind,
    held: s.volumes.length,
    author: s.author,
    thumb: s.coverBook ? getCover(s.coverBook.id)?.images[0]?.thumb : undefined,
  }));
}

export const searchData = (): SearchData => ({ books: books.map(toListItem), authors: authorRecords(), sets: setRecords() });
