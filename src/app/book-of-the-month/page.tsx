// The Book of the Month's own page (opened from the home page). The book is not in the library;
// this page describes it in Al-Islam.org's words and sends readers there to read it.
import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { bookOfTheMonth as b } from "@/lib/bookOfTheMonth";
import { withBase } from "@/lib/paths";

export const metadata: Metadata = {
  title: `Book of the Month: ${b.title}`,
  description: b.description[0],
};

export default function BookOfTheMonthPage() {
  return (
    <div className="container page botm-page">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Book of the Month" }]} />
      <div className="botm-page-grid">
        <a href={b.url} target="_blank" rel="noopener noreferrer" className="botm-page-cover" aria-label={`Read ${b.title} on ${b.source}`}>
          <img src={withBase(b.cover.src)} alt={`Cover of ${b.title}`} width={b.cover.width} height={b.cover.height} />
        </a>
        <div className="botm-page-body">
          <p className="botm-label">Book of the Month · {b.month}</p>
          <h1>{b.title}</h1>
          <p className="botm-page-author">
            by{" "}
            {b.authorSlug ? <Link href={`/authors/${b.authorSlug}/`}>{b.author}</Link> : b.author}
          </p>
          <dl className="botm-facts">
            <dt>Edition</dt>
            <dd>{b.edition}</dd>
            <dt>Translated by</dt>
            <dd>{b.translators}</dd>
            <dt>Publisher</dt>
            <dd>{b.publisher}</dd>
            <dt>ISBN</dt>
            <dd>{b.isbn}</dd>
          </dl>
          {b.description.map((p, i) => (
            <p key={i} className="botm-desc">
              {p}
            </p>
          ))}
          <div className="botm-read">
            <p>
              <strong>This book is not in our library.</strong> You can read the whole book free on {b.source}.
            </p>
            <a className="button botm-button" href={b.url} target="_blank" rel="noopener noreferrer">
              Read it on {b.source} ↗
            </a>
          </div>
          {b.authorSlug && (
            <p className="muted">
              <Link href={`/authors/${b.authorSlug}/`}>More books by {b.authorInCatalogue} in our library →</Link>
            </p>
          )}
          <aside className="sources-note" aria-label="Sources">
            <h2 className="sources-title">Sources</h2>
            <ul>
              <li>
                <span className="sources-label">Description, cover and details:</span>{" "}
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.source}
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
