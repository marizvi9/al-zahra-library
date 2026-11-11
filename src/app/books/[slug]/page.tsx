import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookList from "@/components/BookList";
import CoverGallery from "@/components/CoverGallery";
import AuthorAvatar, { PhotoCredit } from "@/components/AuthorAvatar";
import { photoFor } from "@/lib/authorPhotos";
import {
  authorName,
  authorOf,
  books,
  booksInSubCategory,
  copiesText,
  creditLine,
  getBook,
  getCategory,
  getCover,
  getDescription,
  publisherLabel,
  toListItem,
} from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getBook((await params).slug);
  return b ? { title: b.title, description: `${b.title} — ${creditLine(b)}. ${b.category}.` } : {};
}

export default async function BookPage({ params }: Props) {
  const book = getBook((await params).slug);
  if (!book) notFound();
  const cat = getCategory(book.categorySlug)!;
  const cover = getCover(book.id);
  const author = authorOf(book);
  const authorPhoto = book.author ? photoFor(authorName(book.author)) : null;
  const description = getDescription(book.id);
  // Long descriptions: show the first part, with "Read more" for the rest.
  const [lead, more] = splitDescription(description?.paragraphs ?? []);
  const catHref = `/explore/${book.categorySlug}/`;
  const subHref = `/explore/${book.categorySlug}/${book.subCategorySlug}/`;
  const related = booksInSubCategory(book.categorySlug, book.subCategorySlug)
    .filter((b) => b.slug !== book.slug)
    .slice(0, 6);

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: book.category, href: catHref },
          ...(book.subCategory !== "General" ? [{ label: book.subCategory, href: subHref }] : []),
          { label: book.title },
        ]}
      />

      <article className="book-detail">
        <CoverGallery
          slug={book.slug}
          title={book.title}
          images={cover?.images ?? []}
          source={cover ? { name: cover.source, url: cover.sourceUrl } : undefined}
        />

        <div className="book-detail-body">
          <h1 dir="auto" className={book.titleMissing ? "muted" : undefined}>
            {book.title}
          </h1>
          <p className="book-detail-credit" dir="auto">
            {creditLine(book)}
          </p>
          <p className="tag-row">
            <span className={`status ${book.available ? "is-available" : "is-unavailable"}`}>
              {book.available ? "Available" : "Not available"}
            </span>
            {book.booklet && <span className="tag">Booklet</span>}
          </p>

          <section className="shelf-card" aria-labelledby="shelf-title">
            <h2 id="shelf-title">Find it on the shelf</h2>
            {book.callNumber ? (
              <>
                <p className="shelf-number">{book.callNumber}</p>
                <p className="small">
                  {book.catNo && (
                    <>
                      <strong>{book.catNo}</strong> = {book.category}
                    </>
                  )}
                  {book.subCatNo ? (
                    <>
                      {" · "}
                      <strong>{book.subCatNo}</strong> = {book.subCategory}
                    </>
                  ) : (
                    " · sub-category number not recorded yet"
                  )}
                </p>
              </>
            ) : (
              <p>No call number recorded yet. Please ask at the library desk.</p>
            )}
            {!book.available && (
              <p className="small">This book was not on the shelf at the last check. Please ask at the library desk.</p>
            )}
          </section>

          <dl className="details">
            <div>
              <dt>Author</dt>
              <dd dir="auto">
                <span className="details-author">
                  {book.author && <AuthorAvatar name={authorName(book.author)} size={44} />}
                  <span>
                    {author ? <Link href={`/authors/${author.slug}/`}>{book.author}</Link> : (book.author ?? "Unknown")}
                    {authorPhoto && <PhotoCredit photo={authorPhoto} />}
                  </span>
                </span>
              </dd>
            </div>
            {book.publisher && (
              <div>
                <dt>{publisherLabel(book.publisher)}</dt>
                <dd dir="auto">{book.publisher}</dd>
              </div>
            )}
            <div>
              <dt>Category</dt>
              <dd>
                <Link href={catHref}>{book.category}</Link>
              </dd>
            </div>
            <div>
              <dt>Sub-category</dt>
              <dd>
                {book.subCategory === "General" && cat.subCategories.length === 1 ? (
                  "—"
                ) : (
                  <Link href={subHref}>{book.subCategory}</Link>
                )}
              </dd>
            </div>
            <div>
              <dt>Copies held</dt>
              <dd>{copiesText(book.copies)}</dd>
            </div>
          </dl>

          {description && (
            <section className="book-about" aria-labelledby="about-title">
              <h2 id="about-title">About this book</h2>
              {lead.map((p, i) => (
                <p key={i} dir="auto">
                  {p}
                </p>
              ))}
              {more.length > 0 && (
                <details className="book-about-more">
                  <summary>Read more</summary>
                  {more.map((p, i) => (
                    <p key={i} dir="auto">
                      {p}
                    </p>
                  ))}
                </details>
              )}
              <p className="small muted book-about-source">
                Description from{" "}
                <a href={description.url} target="_blank" rel="noopener noreferrer">
                  {description.source}
                </a>
              </p>
            </section>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-title">
          <div className="section-head">
            <h2 id="related-title">More in {book.subCategory === "General" ? book.category : book.subCategory}</h2>
            <Link href={book.subCategory === "General" ? catHref : subHref} className="see-all">
              See all
            </Link>
          </div>
          <BookList items={related.map(toListItem)} />
        </section>
      )}
    </div>
  );
}

/** Split a description so roughly the first 450 characters show, and the rest sits behind "Read more". */
function splitDescription(paras: string[]): [string[], string[]] {
  const LEAD = 450;
  const lead: string[] = [];
  let used = 0;
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i];
    if (used + p.length <= LEAD || lead.length === 0) {
      if (lead.length === 0 && p.length > LEAD * 1.6) {
        // One very long paragraph: cut it at a sentence near the limit.
        const at = p.indexOf(". ", LEAD);
        if (at > 0 && at < p.length - 80) return [[p.slice(0, at + 1)], [p.slice(at + 2), ...paras.slice(i + 1)]];
      }
      lead.push(p);
      used += p.length;
    } else {
      return [lead, paras.slice(i)];
    }
  }
  return [lead, []];
}
