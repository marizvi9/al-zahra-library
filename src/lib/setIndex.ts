// Which catalogue books belong to a multi-volume set (from data/multi-volume-sets.json).
// Kept tiny and free of the rest of the catalogue so lists, cards and search can all use it.

import raw from "@data/multi-volume-sets.json";

export type SetFile = typeof raw;
export type RawSet = SetFile["sets"][number];

/** What a book card needs to show "Part of a multi-volume set": the set, and which volume this book is. */
export type SetRef = { slug: string; name: string; volume: string; kind: string };

const byId = new Map<number, SetRef>();
for (const s of raw.sets) {
  for (const v of s.volumes) for (const id of v.books) byId.set(id, { slug: s.slug, name: s.name, volume: v.label, kind: s.kind });
}

export const setRefFor = (bookId: number): SetRef | undefined => byId.get(bookId);

/** Every set, for search: name and how many volumes the library holds. */
export const setSummaries = raw.sets.map((s) => ({ slug: s.slug, name: s.name, kind: s.kind, held: s.volumes.length }));
