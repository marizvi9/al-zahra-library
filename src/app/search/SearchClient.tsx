"use client";
// The interactive part of the search page: results update as you type.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BookList from "@/components/BookList";
import AvatarView from "@/components/AvatarView";
import { buildAuthorIndex, buildIndex, search, searchAuthors, variantsIncluded, type AuthorRecord, type SearchRecord, type SearchScope } from "@/lib/search";
import { addRecent, clearRecent, getRecent, onRecentChange, removeRecent } from "@/lib/recentSearches";

const PAGE_SIZE = 30;
const SCOPES: { value: SearchScope; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "category", label: "Category" },
];

type Props = { records: SearchRecord[]; authors: AuthorRecord[]; categories: { name: string; slug: string }[] };

export default function SearchClient({ records, authors, categories }: Props) {
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
  const [shownAuthors, setShownAuthors] = useState(6);

  // Recent searches (kept only in this browser). A search is remembered when you press
  // Enter, open a result, or arrive here from another page's search bar.
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const read = () => setRecent(getRecent());
    read();
    return onRecentChange(read);
  }, []);

  const index = useMemo(() => buildIndex(records), [records]);
  const matches = useMemo(() => search(index, query, scope), [index, query, scope]);
  const authorIndex = useMemo(() => buildAuthorIndex(authors), [authors]);
  // Authors are shown separately above the books, when searching everything or by author.
  const authorMatches = useMemo(
    () => (scope === "all" || scope === "author") && !category ? searchAuthors(authorIndex, query) : [],
    [authorIndex, query, scope, category],
  );
  const variants = useMemo(() => variantsIncluded(query), [query]);
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
    setShownAuthors(6);
  }, [query, scope, category]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="search-page">
      <form
        role="search"
        className="search-box search-box-large"
        onSubmit={(e) => {
          e.preventDefault();
          addRecent(query);
        }}
      >
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

      {!hasQuery && recent.length > 0 && (
        <div className="recent-chips">
          <span className="recent-chips-label">Recent searches:</span>
          <ul>
            {recent.map((q) => (
              <li key={q} className="recent-chip">
                <button type="button" className="recent-chip-text" dir="auto" onClick={() => { setQuery(q); addRecent(q); }}>
                  {q}
                </button>
                <button type="button" className="recent-chip-remove" onClick={() => removeRecent(q)} aria-label={`Remove “${q}” from recent searches`}>
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="link-button small" onClick={clearRecent}>
            Clear all
          </button>
        </div>
      )}

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
            ? authorMatches.length > 0
              ? `No books found for “${query.trim()}”, but ${authorMatches.length === 1 ? "one author matches" : `${authorMatches.length} authors match`}.`
              : `No books found for “${query.trim()}”${categoryName ? ` in ${categoryName}` : ""}.`
            : `Showing ${Math.min(shown, results.length)} of ${results.length} ${results.length === 1 ? "book" : "books"}`}
      </p>

      {hasQuery && variants.length > 0 && (
        <p className="search-hint">
          Also included other spellings:{" "}
          {variants.map((v, i) => (
            <span key={v.typed}>
              {i > 0 && "; "}
              <strong>{v.typed}</strong> → {v.also.join(", ")}
            </span>
          ))}
          . (Capitals, accents, hyphens and apostrophes are ignored, and small typos are forgiven.)
        </p>
      )}

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
              Try fewer words, check the spelling, or <Link href="/explore/">explore the categories</Link>.
            </>
          )}
        </p>
      )}

      {hasQuery && authorMatches.length > 0 && (
        <section aria-labelledby="author-results-h">
          <h2 id="author-results-h" className="results-heading">
            Authors <span className="chip-count">{authorMatches.length}</span>
          </h2>
          <ul className="author-results">
            {authorMatches.slice(0, shownAuthors).map((a) => (
              <li key={a.slug} className="author-result">
                <Link href={`/authors/${a.slug}/`} onClick={() => addRecent(query)}>
                  <AvatarView initials={a.initials} photo={a.photo} size={52} />
                  <span>
                    <span className="name">
                      <span className="type-label">Author</span>
                      {a.name}
                    </span>
                    <span className="meta">
                      {a.count} {a.count === 1 ? "book" : "books"} in the library
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {authorMatches.length > shownAuthors && (
            <button type="button" className="button-secondary" onClick={() => setShownAuthors((n) => n + 12)}>
              Show more authors
            </button>
          )}
        </section>
      )}

      {hasQuery && results.length > 0 && authorMatches.length > 0 && <h2 className="results-heading">Books</h2>}

      <div onClickCapture={(e) => (e.target as HTMLElement).closest("a") && addRecent(query)}>
        <BookList items={results.slice(0, shown)} showCategory />
      </div>

      {results.length > shown && (
        <button type="button" className="button-secondary" onClick={() => setShown((n) => n + PAGE_SIZE)}>
          Show more
        </button>
      )}
    </div>
  );
}
