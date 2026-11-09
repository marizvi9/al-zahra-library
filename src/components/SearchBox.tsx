"use client";
// The search bar (home page and "page not found").
//
// Without JavaScript it is a plain form that opens the full search page.
// With JavaScript, after 2+ characters it shows a dropdown of up to 7 matching books:
//   - Up / Down arrows move through the suggestions, Enter opens the highlighted one
//     (or runs the full search if none is highlighted), Escape closes the list.
//   - Tap or click a suggestion to open it. The last row is "See all results".
// The book data (/search-index.json) is downloaded once, the first time the bar is used.
// Built as an accessible "combobox": screen readers announce the list and the highlighted row.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ArchCover from "./ArchCover";
import { withBase } from "@/lib/paths";
import { buildIndex, suggest, type Indexed, type SearchRecord } from "@/lib/search";

const MAX_SUGGESTIONS = 7;

export default function SearchBox({ large = false }: { large?: boolean }) {
  const router = useRouter();
  const uid = useId().replace(/:/g, "");
  const inputId = `search-${uid}`;
  const listId = `suggestions-${uid}`;

  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // highlighted row, -1 = none
  const loading = useRef(false);
  const rootRef = useRef<HTMLFormElement>(null);

  // Download the book list the first time the visitor clicks in or types.
  const load = useCallback(() => {
    if (records || loading.current) return;
    loading.current = true;
    fetch(withBase("/search-index.json"))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: SearchRecord[]) => setRecords(data))
      .catch(() => {
        loading.current = false; // the plain search form still works
      });
  }, [records]);

  const index: Indexed[] = useMemo(() => (records ? buildIndex(records) : []), [records]);
  const results = useMemo(() => suggest(index, query, MAX_SUGGESTIONS), [index, query]);

  const trimmed = query.trim();
  const ready = trimmed.length >= 2;
  const showList = open && ready && records !== null;
  const seeAllHref = `/search/?q=${encodeURIComponent(trimmed)}`;
  const rowCount = results.length + 1; // + the "See all results" row

  useEffect(() => setActive(-1), [query]);

  // Close when the visitor taps or clicks anywhere else.
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (showList) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
      return;
    }
    if (!ready || records === null) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a === -1 ? (step === 1 ? 0 : rowCount - 1) : (a + step + rowCount) % rowCount));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      go(active < results.length ? `/books/${results[active].slug}/` : seeAllHref);
    }
  };

  const status = !ready
    ? ""
    : records === null
      ? "Loading suggestions…"
      : results.length === 0
        ? "No matching books. Press Enter to search anyway."
        : `${results.length} suggestion${results.length === 1 ? "" : "s"} available. Use the up and down arrow keys to review.`;

  return (
    <form
      ref={rootRef}
      action={withBase("/search/")}
      method="get"
      role="search"
      className={`search-box search-suggest ${large ? "search-box-large" : ""}`}
    >
      <label htmlFor={inputId} className="visually-hidden">
        Search by title, author or category
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        dir="auto"
        placeholder="Search by title, author or category"
        autoComplete="off"
        value={query}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        onFocus={() => {
          load();
          setOpen(true);
        }}
        onChange={(e) => {
          load();
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <button type="submit">Search</button>

      {/* Spoken updates for screen-reader users (not shown on screen). */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {open ? status : ""}
      </p>

      {showList && (
        <ul id={listId} role="listbox" aria-label="Search suggestions" className="suggest-list">
          {results.map((r, i) => (
            <li
              key={r.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`suggest-row ${i === active ? "is-active" : ""}`}
              // Keep the cursor in the input when pressing a row (matters on phones).
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(`/books/${r.slug}/`)}
            >
              <span className="suggest-cover" aria-hidden="true">
                {r.thumb ? <img src={r.thumb} alt="" width={36} height={52} /> : <ArchCover title={r.title} size="small" />}
              </span>
              <span className="suggest-text">
                <span className="suggest-title" dir="auto">
                  {r.title}
                </span>
                <span className="suggest-meta" dir="auto">
                  {r.credit}
                </span>
                <span className="suggest-cat">{r.category}</span>
              </span>
            </li>
          ))}
          <li
            id={`${listId}-${results.length}`}
            role="option"
            aria-selected={active === results.length}
            className={`suggest-row suggest-all ${active === results.length ? "is-active" : ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(results.length)}
            onClick={() => go(seeAllHref)}
          >
            {results.length === 0 ? "No quick matches — search the whole catalog for" : "See all results for"}{" "}
            <strong dir="auto">&ldquo;{trimmed}&rdquo;</strong> <span aria-hidden="true">→</span>
          </li>
        </ul>
      )}
    </form>
  );
}
