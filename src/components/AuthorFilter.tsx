"use client";
// A search box for the Authors page: hides the authors whose names don't match what is typed.
// The full A–Z list is in the page itself (works without JavaScript); this only hides entries.
import { useEffect, useRef, useState } from "react";
import { foldName } from "@/lib/foldName";

export default function AuthorFilter({ listId, total }: { listId: string; total: number }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);
  const live = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = document.getElementById(listId);
    if (!root) return;
    const words = foldName(q).split(" ").filter(Boolean);
    let n = 0;
    root.querySelectorAll<HTMLElement>("[data-search]").forEach((li) => {
      const hay = li.dataset.search ?? "";
      const ok = words.every((w) => hay.includes(w));
      li.hidden = !ok;
      if (ok) n++;
    });
    root.querySelectorAll<HTMLElement>(".author-letter").forEach((sec) => {
      sec.hidden = !sec.querySelector("[data-search]:not([hidden])");
    });
    document.querySelector<HTMLElement>(".letter-jump")?.toggleAttribute("hidden", words.length > 0);
    setShown(n);
  }, [q, listId]);

  return (
    <div className="author-filter" role="search">
      <label htmlFor="author-filter-input" className="author-filter-label">
        Find an author
      </label>
      <div className="search-box">
        <input
          id="author-filter-input"
          type="search"
          placeholder="Type a name, e.g. Mutahhari"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {q && (
          <button type="button" className="button-secondary" onClick={() => setQ("")}>
            Clear
          </button>
        )}
      </div>
      <p ref={live} className="small muted author-filter-count" aria-live="polite">
        {q ? (shown ? `${shown} ${shown === 1 ? "author matches" : "authors match"}` : `No authors match “${q}”.`) : ""}
      </p>
    </div>
  );
}
