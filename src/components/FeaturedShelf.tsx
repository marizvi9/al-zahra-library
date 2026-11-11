// One extra featured section on the home page: a featured author or a theme, with a row
// of books (cover, title, author, a short Google Books description). Each book links to
// its page. On phones the row scrolls sideways.
import Link from "next/link";
import AuthorAvatar from "./AuthorAvatar";
import type { HomeSection } from "@/lib/homeSections";

export default function FeaturedShelf({ section }: { section: HomeSection }) {
  const headingId = `feature-${section.id}`;
  return (
    <section className="container section featured-shelf" aria-labelledby={headingId}>
      <div className="featured-shelf-head">
        {section.author && <AuthorAvatar name={section.author.name} size={64} />}
        <div className="featured-shelf-titles">
          <p className="eyebrow">{section.type === "author" ? "Featured author" : "Featured theme"}</p>
          <h2 id={headingId} dir="auto">
            {section.heading}
          </h2>
          <p className="section-lede">{section.intro}</p>
        </div>
        {section.author && (
          <Link href={`/authors/${section.author.slug}/`} className="see-all">
            All {section.author.count} books
          </Link>
        )}
      </div>
      <ul className="shelf-row">
        {section.books.map((b) => (
          <li key={b.slug}>
            <Link href={`/books/${b.slug}/`} className="shelf-book">
              <span className="shelf-book-cover">
                <img src={b.cover.src} alt="" width={b.cover.width} height={b.cover.height} loading="lazy" decoding="async" />
              </span>
              <span className="shelf-book-title" dir="auto">
                {b.title}
              </span>
              {section.type === "theme" && (
                <span className="shelf-book-author" dir="auto">
                  {b.author}
                </span>
              )}
              <span className="shelf-book-desc">{b.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="slider-credit">
        Descriptions from <a href="https://books.google.com">Google Books</a>.
      </p>
    </section>
  );
}
