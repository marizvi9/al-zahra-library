"use client";
// The interactive part of the Browse page:
// - a filter box that narrows the books shown on this page as you type,
// - a "Search this shelf" link that opens the full search page limited to the shelf,
// - chips to show just one section (or one shelf, on "All shelves"),
// - the books, grouped under section headings with their descriptions.
// The chosen section is kept in the address (e.g. /browse/300/#s50), so it can be
// shared, and old category / sub-category links land on the right section.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import BookList, { type BookListItem } from "./BookList";
import { buildIndex, matchingSlugs, type SearchRecord } from "@/lib/search";

export type BrowseSection = {
  key: string;
  heading: string;
  description?: string;
  href?: string;
  items: (BookListItem & SearchRecord)[];
};

type Props = {
  sections: BrowseSection[];
  scope: string; // "this shelf" or "all shelves"
  chipLabel: string; // "Sections", "Shelves" or "Subjects"
  /** Category the "Search this shelf" link limits the search to. */
  searchCategory?: string;
  /** On the "No number" shelf the chips are categories, so the chosen chip sets the search category. */
  chipsAreCategories?: boolean;
  /** Shown instead of the book lists until something is typed in the filter (the subject cards on "All shelves"). */
  idle?: ReactNode;
};

export default function BrowseClient({ sections, scope, chipLabel, searchCategory, chipsAreCategories, idle }: Props) {
  const [query, setQuery] = useState("");
  const [only, setOnly] = useState(""); // section key, "" = all

  const index = useMemo(() => buildIndex(sections.flatMap((s) => s.items)), [sections]);
  const hasQuery = query.trim().length > 0;
  const matches = useMemo(() => (hasQuery ? matchingSlugs(index, query) : null), [index, query, hasQuery]);

  // Pick up a section from the address (#s50) when the page opens or the hash changes.
  useEffect(() => {
    const read = () => {
      const key = decodeURIComponent(window.location.hash.slice(1));
      setOnly(sections.some((s) => s.key === key) ? key : "");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [sections]);

  const choose = (key: string) => {
    setOnly(key);
    window.history.replaceState(null, "", key ? `#${key}` : window.location.pathname);
  };

  const filtered = sections.map((s) => ({
    ...s,
    shown: matches ? s.items.filter((b) => matches.has(b.slug)) : s.items,
  }));
  const visible = filtered.filter((s) => (!only || s.key === only) && s.shown.length > 0);
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const shownCount = visible.reduce((n, s) => n + s.shown.length, 0);
  const multi = sections.length > 1;

  const linkCategory = chipsAreCategories ? only : searchCategory;
  const qs = new URLSearchParams();
  if (query.trim()) qs.set("q", query.trim());
  if (linkCategory) qs.set("category", linkCategory);
  const searchHref = `/search/${qs.size ? `?${qs}` : ""}`;
  const chipName = chipsAreCategories && only ? sections.find((s) => s.key === only)?.heading : undefined;
  const searchText = chipName ? `Search ${chipName}` : linkCategory ? "Search this shelf" : "Open full search";

  return (
    <div className="browse">
      <div className="browse-tools">
        <form className="browse-filter" role="search" aria-label={`Filter ${scope}`} onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="browse-q" className="browse-filter-label">
            Filter
          </label>
          <input
            id="browse-q"
            type="search"
            dir="auto"
            placeholder="Title, author or topic"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby="browse-count"
          />
        </form>
        <Link href={searchHref} className="browse-search-link">
          {searchText} <span aria-hidden="true">→</span>
        </Link>
      </div>

      {idle && !hasQuery ? (
        idle
      ) : (
        <>
      {multi && !idle && (
        <div className="filter-row" role="group" aria-label={`Show one of the ${chipLabel.toLowerCase()}`}>
          <button type="button" className={`chip ${only === "" ? "is-active" : ""}`} aria-pressed={only === ""} onClick={() => choose("")}>
            All {chipLabel.toLowerCase()} <span className="chip-count">{matches ? matches.size : total}</span>
          </button>
          {filtered.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`chip ${only === s.key ? "is-active" : ""}`}
              aria-pressed={only === s.key}
              onClick={() => choose(only === s.key ? "" : s.key)}
              disabled={s.shown.length === 0 && only !== s.key}
            >
              {s.heading} <span className="chip-count">{s.shown.length}</span>
            </button>
          ))}
        </div>
      )}

      <p id="browse-count" className="browse-count small muted" aria-live="polite">
        {shownCount === total ? `${total} ${total === 1 ? "book" : "books"}` : `Showing ${shownCount} of ${total} books`}
      </p>

      {visible.length === 0 && (
        <p className="empty">
          No books match{hasQuery ? ` “${query.trim()}”` : ""} here. Try fewer words, choose{" "}
          {multi ? `“All ${chipLabel.toLowerCase()}”` : "another shelf"}, or{" "}
          <Link href={`/search/?q=${encodeURIComponent(query.trim())}`}>search the whole catalog</Link>.
        </p>
      )}

      {visible.map((s) => (
        <section key={s.key} id={s.key} className="browse-section" aria-labelledby={`h-${s.key}`}>
          <h3 id={`h-${s.key}`} className="shelf-section-heading">
            {s.href ? <Link href={s.href}>{s.heading}</Link> : s.heading}{" "}
            <span className="chip-count">{s.shown.length}</span>
          </h3>
          {s.description && <p className="section-desc">{s.description}</p>}
          <BookList items={s.shown} />
        </section>
      ))}
        </>
      )}
    </div>
  );
}
