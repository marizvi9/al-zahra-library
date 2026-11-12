// An author's books shown large on their own page: big covers in a roomy grid, each with
// title, category, shelf number and a link to the book. With only one or two books the
// cards are bigger still (cover beside the details), so the page doesn't look empty.
// Like the other cards, the title link is stretched over the card and co-author links sit
// on top, so no link is nested inside another.
import { ViewTransition } from "react";
import Link from "next/link";
import ArchCover from "./ArchCover";
import Credit from "./Credit";
import SetLabel from "./SetLabel";
import { setRefFor } from "@/lib/setIndex";
import { creditParts, getCover, type Book } from "@/lib/catalog";
import { withBase } from "@/lib/paths";

export default function AuthorBooks({ books, authorSlug }: { books: Book[]; authorSlug: string }) {
  const few = books.length <= 2;
  return (
    <ul className={`author-books ${few ? "is-few" : ""}`}>
      {books.map((b, i) => {
        const img = getCover(b.id)?.images[0];
        const parts = creditParts(b);
        const others = parts.some((p) => p.slug && p.slug !== authorSlug); // co-authors or translators
        return (
          <li key={b.slug} className="author-book" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
            <ViewTransition name={`cover-${b.slug}`} share="morph" default="none">
              <span className="author-book-cover">
                {img ? (
                  <img
                    src={withBase(img.src)}
                    srcSet={
                      img.large && img.largeWidth && img.largeWidth > img.width
                        ? `${withBase(img.src)} ${img.width}w, ${withBase(img.large)} ${img.largeWidth}w`
                        : undefined
                    }
                    sizes={few ? "(max-width: 700px) 70vw, 300px" : "(max-width: 520px) 80vw, (max-width: 900px) 40vw, 260px"}
                    alt=""
                    width={img.width}
                    height={img.height}
                    loading={i < 3 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : (
                  <ArchCover title={b.title} author={b.author} seed={setRefFor(b.id)?.slug ?? b.slug} />
                )}
              </span>
            </ViewTransition>
            <span className="author-book-text">
              <Link href={`/books/${b.slug}/`} className="author-book-title card-link" dir="auto">
                {b.title}
              </Link>
              {others && (
                <span className="author-book-credit" dir="auto">
                  <Credit parts={parts} current={authorSlug} />
                </span>
              )}
              <span className="author-book-cat">
                {b.category}
                {b.subCategory && b.subCategory !== "General" ? ` › ${b.subCategory}` : ""}
              </span>
              {setRefFor(b.id) && <SetLabel set={setRefFor(b.id)!} />}
              <span className="author-book-meta">
                {b.callNumber && (
                  <span className="call-badge">
                    <span className="visually-hidden">Shelf </span>
                    {b.callNumber}
                  </span>
                )}
                {!b.available && <span className="status-text">Not available</span>}
              </span>
              <span className="author-book-more" aria-hidden="true">
                View book <span>→</span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
