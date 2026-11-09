"use client";
// The interactive part of the search page: results update as you type.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BookList from "@/components/BookList";
import { buildIndex, search, type SearchRecord, type SearchScope } from "@/lib/search";

const PAGE_SIZE = 30;
const SCOPES: { value: SearchScope; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "category", label: "Category" },
];

type Props = { records: SearchRecord[]; categories: { name: string; slug: string }[] };

export default function SearchClient({ records, categories }: Props) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [scope, setScope] = useState<SearchScope>("all");
  // ?category=fiqh (from a "Search this shelf" link) starts the search inside that category.
  const [category, setCategory] = useState(() => {
    const c = params.get("category") ?? "";
    return categories.some((x) => x.slug === c) ? c : "";
  });
  const categoryName = categories.find((c) => c.slug === category)?.name;
  const [shown, setShown] = useState(PAGE_SIZE);

  const index = useMemo(() => buildIndex(records), [records]);
  const matches = useMemo(() => search(index, query, scope), [index, query, scope]);
  const results = category ? matches.filter((r) => r.categorySlug === category) : matches;

  // Count matches per category, for the filter buttons.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of matches) m.set(r.categorySlug, (m.get(r.categorySlug) ?? 0) + 1);
    return m;
  }, [matches]);

  // Keep the address bar in step, so a search can be bookmarked or shared.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (category) qs.set("category", category);
    const url = qs.size ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
    setShown(PAGE_SIZE);
  }, [query, scope, category]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="search-page">
      <form role="search" className="search-box search-box-large" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="q" className="visually-hidden">
          Search by title, author or category
        </label>
        <input
          id="q"
          type="search"
          dir="auto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author or category"
          autoComplete="off"
          autoFocus
        />
      </form>

      <fieldset className="scope">
        <legend className="visually-hidden">Search in</legend>
        {SCOPES.map((s) => (
          <label key={s.value} className={`scope-option ${scope === s.value ? "is-active" : ""}`}>
            <input
              type="radio"
              name="scope"
              value={s.value}
              checked={scope === s.value}
              onChange={() => setScope(s.value)}
            />
            {s.label}
          </label>
        ))}
      </fieldset>

      {categoryName && (
        <p className="search-within">
          Searching in <strong>{categoryName}</strong>
          <button type="button" className="search-within-clear" onClick={() => setCategory("")}>
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden">Stop searching only in {categoryName}; search all books</span>
          </button>
        </p>
      )}

      <p className="result-count" role="status" aria-live="polite">
        {!hasQuery
          ? categoryName
            ? `Type to search the ${records.filter((r) => r.categorySlug === category).length} books in ${categoryName}.`
            : `Type to search ${records.length} books.`
          : results.length === 0
            ? `No books found for “${query.trim()}”${categoryName ? ` in ${categoryName}` : ""}.`
            : `Showing ${Math.min(shown, results.length)} of ${results.length} ${results.length === 1 ? "book" : "books"}`}
      </p>

      {hasQuery && counts.size > 1 && (
        <div className="filter-row" aria-label="Filter by category" role="group">
          <button type="button" className={`chip ${category === "" ? "is-active" : ""}`} aria-pressed={category === ""} onClick={() => setCategory("")}>
            All <span className="chip-count">{matches.length}</span>
          </button>
          {categories
            .filter((c) => counts.has(c.slug))
            .map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`chip ${category === c.slug ? "is-active" : ""}`}
                aria-pressed={category === c.slug}
                onClick={() => setCategory(c.slug)}
              >
                {c.name} <span className="chip-count">{counts.get(c.slug)}</span>
              </button>
            ))}
        </div>
      )}

      {hasQuery && results.length === 0 && (
        <p className="muted">
          {categoryName && matches.length > 0 ? (
            <>
              {matches.length} {matches.length === 1 ? "book matches" : "books match"} on other shelves.{" "}
              <button type="button" className="link-button" onClick={() => setCategory("")}>
                Search all books
              </button>
              .
            </>
          ) : (
            <>
              Try fewer words, check the spelling, or <Link href="/explore/">explore the shelves</Link>.
            </>
          )}
        </p>
      )}

      <BookList items={results.slice(0, shown)} showCategory />

      {results.length > shown && (
        <button type="button" className="button-secondary" onClick={() => setShown((n) => n + PAGE_SIZE)}>
          Show more
        </button>
      )}
    </div>
  );
}
