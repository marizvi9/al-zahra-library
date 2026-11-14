import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArchCover from "@/components/ArchCover";
import rawFinds from "@data/web-finds.json";
import { books, creditLine, getCover, getDescription } from "@/lib/catalog";

// A checking page for the librarian: every book searched for in data/web-finds.json, what was found,
// how sure we are, where it came from, and what still needs a person to look at it. Not linked from the menus.
export const metadata: Metadata = { title: "Review: covers and descriptions", robots: { index: false, follow: false } };

type Find = {
  searched?: string[];
  description?: { text: string[]; source: string; url: string; confidence: string };
  cover?: { source: string; sourceUrl: string; confidence: string };
  note?: string;
  coverNote?: string;
  needsReview?: boolean;
};

export default function ReviewPage() {
  const finds = (rawFinds as unknown as { books: Record<string, Find> }).books;
  const rows = Object.entries(finds).map(([id, f]) => ({ id, f, book: books.find((b) => String(b.id) === id)! })).filter((r) => r.book);
  const withDesc = rows.filter((r) => r.f.description && !r.f.needsReview).length;
  const withCover = rows.filter((r) => r.f.cover && !r.f.needsReview).length;
  const review = rows.filter((r) => r.f.needsReview).length;
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Review" }]} />
      <header className="page-head">
        <h1>Review: covers and descriptions from the web</h1>
        <p className="lede">
          {rows.length} books searched · {withDesc} new descriptions · {withCover} new covers · {review} need review
        </p>
      </header>
      <ul className="review-list">
        {rows.map(({ id, f, book }) => {
          const cover = getCover(book.id)?.images[0];
          const desc = getDescription(book.id);
          return (
            <li key={id} className={`review-item ${f.needsReview ? "is-flagged" : ""}`}>
              <span className="review-cover">
                {cover ? <img src={cover.thumb ?? cover.src} alt="" /> : <ArchCover title={book.title} author={creditLine(book)} seed={book.slug} size="small" />}
              </span>
              <div className="review-text">
                <p className="review-title">
                  <Link href={`/books/${book.slug}/`}>{book.title}</Link> <span className="muted">· #{id} · {creditLine(book)}</span>
                </p>
                {f.needsReview && <p className="review-flag">Needs review: not shown on the site yet.</p>}
                {f.description ? (
                  <p>
                    <strong>Description</strong> ({f.description.confidence}) from{" "}
                    <a href={f.description.url} target="_blank" rel="noopener noreferrer">{f.description.source}</a>:{" "}
                    {f.description.text.join(" ")}
                  </p>
                ) : (
                  <p className="muted">No description found{desc ? " (keeps its earlier one)" : ""}.</p>
                )}
                <p>
                  <strong>Cover:</strong>{" "}
                  {f.cover ? (
                    <>
                      real cover ({f.cover.confidence}) from{" "}
                      <a href={f.cover.sourceUrl} target="_blank" rel="noopener noreferrer">{f.cover.source}</a>
                    </>
                  ) : cover ? (
                    "keeps its earlier cover"
                  ) : (
                    "our drawn cover"
                  )}
                  {f.coverNote ? ` (${f.coverNote})` : ""}
                </p>
                {f.note && <p className="small muted">Note: {f.note}</p>}
                {f.searched && <p className="small muted">Searched: {f.searched.join(", ")}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
