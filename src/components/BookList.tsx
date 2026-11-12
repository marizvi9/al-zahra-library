import { ViewTransition } from "react";
import Link from "next/link";
import SetLabel from "./SetLabel";
import type { SetRef } from "@/lib/setIndex";
import ArchCover from "./ArchCover";
import Credit from "./Credit";
import type { CreditPart } from "@/lib/catalog";

export type BookListItem = {
  slug: string;
  title: string;
  credit: string;
  creditParts?: CreditPart[];
  category?: string;
  subCategory?: string;
  callNumber: string | null;
  thumb?: string;
  available?: boolean;
  set?: SetRef;
};

// Each row is a card: the title is the link to the book, stretched (with CSS) to cover the
// whole card, while author names are their own links sitting on top. So clicking an author
// opens the author, clicking anywhere else opens the book, and no link sits inside another.
export default function BookList({
  items,
  showCategory = false,
  currentAuthor,
}: {
  items: BookListItem[];
  showCategory?: boolean;
  /** On an author's page: their slug, so their own name isn't a link. */
  currentAuthor?: string;
}) {
  return (
    <ul className="book-list">
      {items.map((b, i) => (
        <li key={b.slug} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
          <div className="book-row">
            {/* Same name as the big cover on the book page, so it glides into place. */}
            <ViewTransition name={`cover-${b.slug}`} share="morph" default="none">
              <span className="book-row-cover">
                {b.thumb ? (
                  <img src={b.thumb} alt="" loading="lazy" decoding="async" />
                ) : (
                  <ArchCover title={b.title} author={b.credit} seed={b.slug} size="small" />
                )}
              </span>
            </ViewTransition>
            <span className="book-row-text">
              <Link href={`/books/${b.slug}/`} className="book-row-title card-link" dir="auto">
                {b.title}
              </Link>
              <span className="book-row-credit" dir="auto">
                {b.creditParts ? <Credit parts={b.creditParts} current={currentAuthor} /> : b.credit}
              </span>
              {showCategory && b.category && (
                <span className="book-row-cat">
                  {b.category}
                  {b.subCategory && b.subCategory !== "General" ? ` › ${b.subCategory}` : ""}
                </span>
              )}
              {b.set && <SetLabel set={b.set} />}
              {b.available === false && <span className="status-text">Not available</span>}
            </span>
            {b.callNumber && (
              <span className="call-badge">
                <span className="visually-hidden">Call number </span>
                {b.callNumber}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
