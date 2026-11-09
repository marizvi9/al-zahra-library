"use client";
// The interactive part of the Browse page:
// - a search box that filters the books shown (this shelf, or every shelf),
// - chips to show just one section (or one shelf, on "All shelves"),
// - the books, grouped under section headings with their descriptions.
// The chosen section is kept in the address (e.g. /browse/300/#s50), so it can be
// shared, and old category / sub-category links land on the right section.

import { useEffect, useMemo, useState } from "react";
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
  chipLabel: string; // "Sections" or "Shelves"
};

export default function BrowseClient({ sections, scope, chipLabel }: Props) {
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

  return (
    <div className="browse">
      <form role="search" className="search-box browse-search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="browse-q" className="visually-hidden">
          Search {scope} by title, author or category
        </label>
        <input
          id="browse-q"
          type="search"
          dir="auto"
          placeholder={`Search ${scope}`}
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {multi && (
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

      <p className="browse-count small muted" aria-live="polite">
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
          <h2 id={`h-${s.key}`} className="shelf-section-heading">
            {s.href ? <Link href={s.href}>{s.heading}</Link> : s.heading}{" "}
            <span className="chip-count">{s.shown.length}</span>
          </h2>
          {s.description && <p className="section-desc">{s.description}</p>}
          <BookList items={s.shown} />
        </section>
      ))}
    </div>
  );
}
