"use client";
// The big book grid on the Explore pages: a roomy grid of large covers, each with the title,
// the author (a link), and a short preview of the description. A book with no description
// shows its shelf and category instead. Long lists show the first 24 books, then a
// "Show more" button adds 24 at a time (a real button, so it works with the keyboard).
// As in BookList, the title link is stretched over the whole card and author names sit on top.

import { useState } from "react";
import Link from "next/link";
import ArchCover from "./ArchCover";
import Credit from "./Credit";
import SetLabel from "./SetLabel";
import type { GridItem } from "@/lib/catalog";

const PAGE = 24;

export default function BookGrid({ items, showCategory = false, paged = true }: { items: GridItem[]; showCategory?: boolean; /** false: show every book, no "Show more" button */ paged?: boolean }) {
  const [count, setCount] = useState(PAGE);
  const shown = paged ? items.slice(0, count) : items;
  const left = items.length - shown.length;

  return (
    <>
      <ul className="big-grid">
        {shown.map((b) => (
          <li key={b.slug}>
            <div className="big-book">
              <span className="big-book-cover">
                {b.cover ? (
                  <img src={b.cover.src} alt="" width={b.cover.width} height={b.cover.height} loading="lazy" decoding="async" />
                ) : (
                  <ArchCover title={b.title} author={b.credit} seed={b.set?.slug ?? b.slug} size="large" />
                )}
              </span>
              <span className="big-book-text">
                <Link href={`/books/${b.slug}/`} className="big-book-title card-link" dir="auto">
                  {b.title}
                </Link>
                <span className="big-book-credit" dir="auto">
                  {b.creditParts ? <Credit parts={b.creditParts} /> : b.credit}
                </span>
                {b.blurb ? (
                  <span className="big-book-blurb" dir="auto">
                    {b.blurb}
                  </span>
                ) : (
                  <span className="big-book-shelf">
                    {b.callNumber ? `Shelf ${b.callNumber} · ` : ""}
                    {b.category}
                    {b.subCategory && b.subCategory !== "General" ? ` › ${b.subCategory}` : ""}
                  </span>
                )}
                {b.set && <SetLabel set={b.set} />}
                {showCategory && b.blurb && b.category && (
                  <span className="big-book-shelf">
                    {b.callNumber ? `Shelf ${b.callNumber} · ` : ""}
                    {b.category}
                  </span>
                )}
                <span className="big-book-more" aria-hidden="true">
                  Read more →
                </span>
                {b.available === false && <span className="status-text">Not available</span>}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {paged && (
        <p className="big-grid-status small muted" role="status" aria-live="polite">
          Showing {shown.length} of {items.length} {items.length === 1 ? "book" : "books"}
        </p>
      )}
      {left > 0 && (
        <p className="big-grid-more">
          <button type="button" className="button-secondary" onClick={() => setCount(count + PAGE)}>
            Show {Math.min(PAGE, left)} more ({left} left)
          </button>
        </p>
      )}
    </>
  );
}
