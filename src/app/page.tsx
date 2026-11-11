import Link from "next/link";
import Girih from "@/components/Girih";
import Ornament from "@/components/Ornament";
import SearchBox from "@/components/SearchBox";
import CategoryCard from "@/components/CategoryCard";
import FeaturedSlider from "@/components/FeaturedSlider";
import { Emblem } from "@/components/Emblem";
import { featuredSlides } from "@/lib/featured";
import { featuredAuthors, homeSections } from "@/lib/homeSections";
import FeaturedAuthors from "@/components/FeaturedAuthors";
import FeaturedShelf from "@/components/FeaturedShelf";
import AuthorAvatar from "@/components/AuthorAvatar";
import {
  authors,
  bookSets,
  books,
  categories,
  featuredCategories,
  moreToExplore,
  shelves,
  topAuthors,
  authorsByLetter,
  type Book,
} from "@/lib/catalog";

/** An author's two most common subjects, e.g. "Philosophy, Theology". */
function mainSubjects(list: Book[]) {
  const counts = new Map<string, number>();
  for (const b of list) counts.set(b.category, (counts.get(b.category) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([c]) => c)
    .join(", ");
}

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-arch">
          <Girih className="girih-hero" />
          <div className="hero-content">
            <Emblem className="hero-emblem" />
            <div className="hero-text">
              <h1 id="hero-title">
                Welcome to the <span className="nowrap">Al-Zahra</span> Islamic Library
              </h1>
              <p className="hero-sub">at the Islamic Education Center of Houston</p>
              <Ornament className="hero-ornament" />
              <p className="hero-lede">
                We&rsquo;re glad you&rsquo;re here. Explore {books.length} books on faith, history, law, thought
                and more.
              </p>
              <SearchBox large />
            </div>
          </div>
        </div>
      </section>

      <div className="container section">
        <FeaturedSlider slides={featuredSlides} />
      </div>

      {/* Extra featured sections, set in data/home-featured-sections.json */}
      {homeSections
        .filter((s) => s.placement === "after-slider")
        .map((s) => (
          <FeaturedShelf key={s.id} section={s} />
        ))}

      {/* Explore by category: six featured subjects with their covers, then the rest. */}
      <section className="container section" aria-labelledby="featured-title">
        <div className="section-head">
          <h2 id="featured-title">Explore by category</h2>
          <Link href="/explore/" className="see-all">
            All {categories.length} categories
          </Link>
        </div>
        <ul className="card-grid">
          {featuredCategories.map((c) => (
            <li key={c.slug}>
              <CategoryCard category={c} />
            </li>
          ))}
        </ul>
        <h3 className="section-subhead">More subjects</h3>
        <ul className="chip-list">
          {moreToExplore.map((c) => (
            <li key={c.slug}>
              <Link href={`/explore/${c.slug}/`} className="chip">
                {c.name} <span className="chip-count">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured Authors: large portraits, chosen in data/home-featured-sections.json */}
      {featuredAuthors && <FeaturedAuthors {...featuredAuthors} />}

      {/* Every author in the library. The authors with the most books come first as cards
          (featured authors included, so they show here as well as above), then the full A–Z list. */}
      <section className="container section" aria-labelledby="authors-title">
        <div className="section-head">
          <h2 id="authors-title">Authors in our collection</h2>
          <Link href="/authors/" className="see-all">
            All {authors.length} authors
          </Link>
        </div>
        <ul className="author-cards">
          {topAuthors(12).map((a) => (
            <li key={a.slug}>
              <Link href={`/authors/${a.slug}/`} className="author-card">
                <AuthorAvatar name={a.name} size={52} />
                <span className="author-card-text">
                  <span className="author-card-name" dir="auto">
                    {a.name}
                  </span>
                  <span className="author-card-meta">
                    {a.count} books · {mainSubjects(a.books)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <details className="all-authors">
          <summary>Show all {authors.length} authors, A to Z</summary>
          {[...authorsByLetter()].map(([letter, list]) => (
            <div key={letter} className="all-authors-letter">
              <h3>{letter}</h3>
              <ul>
                {list.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/authors/${a.slug}/`} dir="auto">
                      {a.name}
                    </Link>{" "}
                    <span className="all-authors-count">({a.count})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      </section>

      {homeSections
        .filter((s) => s.placement === "after-authors")
        .map((s) => (
          <FeaturedShelf key={s.id} section={s} />
        ))}

      {/* Multi-volume sets: shown only where the library holds 2+ different volumes. */}
      {bookSets.length > 0 && (
        <section className="container section" aria-labelledby="sets-title">
          <h2 id="sets-title">Multi-volume sets</h2>
          <p className="section-lede">Works the library holds in more than one volume.</p>
          <ul className="set-list">
            {bookSets.map((set) => (
              <li key={set.title} className="set-row">
                <span className="set-title" dir="auto">
                  {set.title}
                </span>
                <span className="set-volumes">
                  {set.volumes.map((v) => (
                    <Link key={v.book.slug} href={`/books/${v.book.slug}/`} className="set-vol" title={v.book.title}>
                      {v.label}
                    </Link>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Browse by shelf number: as the books stand in the library. */}
      <section className="container section" aria-labelledby="shelves-title">
        <div className="section-head">
          <h2 id="shelves-title">Browse by shelf number</h2>
          <Link href="/shelves/" className="see-all">
            All shelves
          </Link>
        </div>
        <ul className="shelf-strip">
          {shelves.map((sh) => (
            <li key={sh.slug}>
              <Link href={`/shelves/${sh.slug}/`} className="shelf-chip">
                <span className="shelf-chip-no">{sh.number ?? "—"}</span>
                <span className="shelf-chip-name">{sh.number ? sh.categories.join(", ") : "No shelf number"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
