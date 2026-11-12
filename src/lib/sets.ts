// Multi-volume sets, ready for pages: each set with its volumes in order, the books behind them,
// which volume numbers are missing from the catalogue, and a cover. Data: data/multi-volume-sets.json.

import raw from "@data/multi-volume-sets.json";
import { books, getCover, type Book } from "./catalog";
import type { RawSet } from "./setIndex";

export type SetVolume = { label: string; numbers: number[]; note?: string; books: Book[] };
export type VolumeSet = {
  slug: string;
  name: string;
  kind: "set" | "series";
  description: string | null;
  notes: string;
  totalVolumes: number | null;
  volumes: SetVolume[];
  /** Volume (or part) numbers that the catalogue does not hold, e.g. "Volume 1" or "Volumes 4–5". Empty for a series. */
  missing: string | null;
  /** The book whose cover stands for the set (volume 1 if it has one, else the first volume with a cover). */
  coverBook: Book | undefined;
  author: string | null;
};

const byId = new Map(books.map((b) => [b.id, b]));
const ranges = (nums: number[]) => {
  const out: string[] = [];
  for (let i = 0; i < nums.length; ) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push(j > i ? `${nums[i]}–${nums[j]}` : `${nums[i]}`);
    i = j + 1;
  }
  return out;
};

function build(s: RawSet): VolumeSet {
  const volumes: SetVolume[] = s.volumes.map((v) => ({
    label: v.label,
    numbers: v.numbers,
    note: (v as { note?: string }).note,
    books: v.books.map((id) => {
      const b = byId.get(id);
      if (!b) throw new Error(`data/multi-volume-sets.json: set "${s.name}" lists book id ${id}, which is not in the catalogue.`);
      return b;
    }),
  }));
  let missing: string | null = null;
  if (s.kind === "set") {
    const have = new Set<number>();
    for (const v of volumes) for (let n = v.numbers[0]; n <= v.numbers[v.numbers.length - 1]; n++) have.add(n);
    const top = Math.max(s.totalVolumes ?? 0, ...have);
    const gone = Array.from({ length: top }, (_, i) => i + 1).filter((n) => !have.has(n));
    const word = /^part/i.test(volumes[0].label) ? "Part" : /^book/i.test(volumes[0].label) ? "Book" : "Volume";
    if (gone.length) missing = `${word}${gone.length > 1 ? "s" : ""} ${ranges(gone).join(", ")}`;
  }
  const withCover = (v: SetVolume) => v.books.find((b) => getCover(b.id)?.images[0]);
  const coverBook = volumes.map(withCover).find(Boolean);
  const authors = [...new Set(volumes.flatMap((v) => v.books.map((b) => b.author).filter(Boolean)))] as string[];
  return {
    slug: s.slug,
    name: s.name,
    kind: s.kind as "set" | "series",
    description: s.description ?? null,
    notes: s.notes,
    totalVolumes: s.totalVolumes ?? null,
    volumes,
    missing,
    coverBook,
    author: authors[0] ?? null,
  };
}

export const volumeSets: VolumeSet[] = raw.sets.map(build);
export const getSet = (slug: string) => volumeSets.find((s) => s.slug === slug);
export const setOfBook = (bookId: number) => volumeSets.find((s) => s.volumes.some((v) => v.books.some((b) => b.id === bookId)));

/** The volume before and after this book in its set, for "previous / next volume" links. */
export function neighbours(set: VolumeSet, bookId: number) {
  const i = set.volumes.findIndex((v) => v.books.some((b) => b.id === bookId));
  return { prev: set.volumes[i - 1], next: set.volumes[i + 1], index: i };
}
