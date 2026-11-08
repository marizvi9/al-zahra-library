import { ViewTransition } from "react";
import Link from "next/link";
import ArchCover from "./ArchCover";

export type BookListItem = {
  slug: string;
  title: string;
  credit: string;
  category?: string;
  subCategory?: string;
  callNumber: string | null;
  thumb?: string;
  available?: boolean;
};

export default function BookList({ items, showCategory = false }: { items: BookListItem[]; showCategory?: boolean }) {
  return (
    <ul className="book-list">
      {items.map((b, i) => (
        <li key={b.slug} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
          <Link href={`/books/${b.slug}/`} className="book-row">
            {/* Same name as the big cover on the book page, so it glides into place. */}
            <ViewTransition name={`cover-${b.slug}`} share="morph" default="none">
              <span className="book-row-cover">
                {b.thumb ? (
                  <img src={b.thumb} alt="" loading="lazy" decoding="async" />
                ) : (
                  <ArchCover title={b.title} size="small" />
                )}
              </span>
            </ViewTransition>
            <span className="book-row-text">
              <span className="book-row-title" dir="auto">
                {b.title}
              </span>
              <span className="book-row-credit" dir="auto">
                {b.credit}
              </span>
              {showCategory && b.category && (
                <span className="book-row-cat">
                  {b.category}
                  {b.subCategory && b.subCategory !== "General" ? ` › ${b.subCategory}` : ""}
                </span>
              )}
              {b.available === false && <span className="status-text">Not available</span>}
            </span>
            {b.callNumber && (
              <span className="call-badge">
                <span className="visually-hidden">Call number </span>
                {b.callNumber}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
