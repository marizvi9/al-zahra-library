// A small, fast search that runs entirely in the visitor's browser.
// With ~800 books there is no need for a search server.

export type SearchRecord = {
  slug: string;
  title: string;
  credit: string;
  category: string;
  categorySlug: string;
  subCategory: string;
  callNumber: string | null;
  thumb?: string;
  available?: boolean;
};

export type SearchScope = "all" | "title" | "author" | "category";

/**
 * Make text easy to compare: lower-case, accents removed (Kitāb → kitab),
 * apostrophes removed (Shi'a → shia), and punctuation turned into spaces.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’`ʿʾ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

type Indexed = SearchRecord & { t: string; a: string; c: string };

export function buildIndex(records: SearchRecord[]): Indexed[] {
  return records.map((r) => ({
    ...r,
    t: " " + normalize(r.title),
    a: " " + normalize(r.credit),
    c: " " + normalize(`${r.category} ${r.subCategory} ${r.callNumber ?? ""}`),
  }));
}

/** Every word typed must match the start of a word somewhere in the chosen fields. */
export function search(index: Indexed[], query: string, scope: SearchScope): SearchRecord[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const q = " " + words.join(" ");

  const scored: { r: Indexed; score: number }[] = [];
  for (const r of index) {
    let score = 0;
    let ok = true;
    for (const w of words) {
      const needle = " " + w;
      const inT = scope !== "author" && scope !== "category" && r.t.includes(needle);
      const inA = (scope === "all" || scope === "author") && r.a.includes(needle);
      const inC = (scope === "all" || scope === "category") && r.c.includes(needle);
      if (!inT && !inA && !inC) {
        ok = false;
        break;
      }
      score += (inT ? 3 : 0) + (inA ? 2 : 0) + (inC ? 1 : 0);
    }
    if (!ok) continue;
    if (r.t.startsWith(q)) score += 6; // title begins with the search
    else if (r.t.includes(q)) score += 3; // exact phrase in title
    scored.push({ r, score });
  }

  return scored
    .sort((x, y) => y.score - x.score || x.r.title.localeCompare(y.r.title))
    .map(({ r }) => r);
}
