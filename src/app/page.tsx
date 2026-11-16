import BookOfTheMonthBanner from "@/components/BookOfTheMonthBanner";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import VisitInfo from "@/components/VisitInfo";
import FeaturedSets from "@/components/FeaturedSets";
import { homeFeaturedSets, volumeSets } from "@/lib/sets";
import CategoryCard from "@/components/CategoryCard";
import FeaturedSlider from "@/components/FeaturedSlider";
import { Emblem } from "@/components/Emblem";
import { featuredSlides } from "@/lib/featured";
import { featuredAuthors, homeSections } from "@/lib/homeSections";
import FeaturedAuthors from "@/components/FeaturedAuthors";
import FeaturedShelf from "@/components/FeaturedShelf";
import AuthorAvatar from "@/components/AuthorAvatar";
import { IecLink } from "@/components/LibraryLinks";
import {
  authors,
  books,
  categories,
  featuredCategories,
  moreToExplore,
  topAuthors,
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

/** "What would you like to do?" tiles, as on the big library sites. Line icons only. */
const TASKS = [
  { href: "/search/", title: "Search the catalog", text: "Find a book by title, author or subject.", icon: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z M15.5 15.5 21 21" },
  { href: "/explore/", title: "Browse by subject", text: "From Quran and Hadith to history and fiqh.", icon: "M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z M20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" },
  { href: "/shelves/", title: "Find a shelf", text: "See the books as they stand, shelf by shelf.", icon: "M4 4h16 M4 12h16 M4 20h16 M7 4v8 M10 4v8 M15 12v8 M18 12v8" },
  { href: "/visit/", title: "Visit us", text: "Location, hours and how to find a book.", icon: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z M12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" },
];

export default function HomePage() {
  return (
    <>
      {/* Welcome banner, laid out like the title page of a printed catalog: flat parchment between
          gold rules, the emblem in a bookplate frame, and a plainly labelled catalog search. */}
      <section className="hero catalog-head" aria-labelledby="hero-title">
        <div className="ch-frame">
          <div className="ch-plate">
            <Emblem className="hero-emblem" />
          </div>
          <div className="ch-main">
            <h1 id="hero-title">
              Welcome to the <span className="nowrap">Al-Zahra</span> Islamic Library
            </h1>
            <p className="hero-sub">
              at the <IecLink />
            </p>
            <p className="hero-lede">
              {/* Rounded down to the hundred, so "over" stays true as books are added. */}
              Search our diverse catalog of over {Math.floor((books.length - 1) / 100) * 100} books!
            </p>
            <SearchBox
              large
              label="Catalog search"
            />
          </div>
          {/* The collection's holdings; each count opens the page that lists them. */}
          <ul className="hero-facts" aria-label="The collection">
            {[
              { href: "/shelves/", label: "Books", n: books.length },
              { href: "/authors/", label: "Authors", n: authors.length },
              { href: "/explore/", label: "Subjects", n: categories.length },
              { href: "/sets/", label: "Multi-volume sets", n: volumeSets.length },
            ].map((f) => (
              <li key={f.href}>
                <Link href={f.href}>
                  <span className="hf-label">{f.label}</span>
                  <span className="hf-num">{f.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container section">
        <BookOfTheMonthBanner />
        <FeaturedSlider slides={featuredSlides} />
        {/* Quick tasks, as the big library sites have. */}
        <ul className="task-tiles" aria-label="What would you like to do?">
          {TASKS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="task-tile">
                <svg className="task-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={t.icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="task-text">
                  <span className="task-title">{t.title}</span>
                  <span className="task-desc">{t.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
        <ul className="card-grid card-grid-compact">
          {featuredCategories.map((c) => (
            <li key={c.slug}>
              <CategoryCard category={c} compact />
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
          (featured authors included, so they show here as well as above), with a link to the Authors page (the full A–Z list) at the top. */}
      <section className="container section" aria-labelledby="authors-title">
        <div className="section-head">
          <h2 id="authors-title">Authors in our collection</h2>
          {/* Looks like the old fold-out line, but goes to the Authors page. */}
          <div className="all-authors">
            <Link href="/authors/" className="all-authors-summary">
              <span className="all-authors-marker" aria-hidden="true">▸</span> Show all {authors.length} authors, A to Z
            </Link>
          </div>
        </div>
        <ul className="author-cards">
          {topAuthors(12).map((a) => (
            <li key={a.slug}>
              <Link href={`/authors/${a.slug}/`} className="author-card">
                <AuthorAvatar name={a.name} size={52} />
                <span className="author-card-text">
                  <span className="author-card-name" dir="auto">
                    {a.display}
                  </span>
                  <span className="author-card-meta">
                    {a.count} books · {mainSubjects(a.books)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {homeSections
        .filter((s) => s.placement === "after-authors")
        .map((s) => (
          <FeaturedShelf key={s.id} section={s} />
        ))}

      {/* Three multi-volume sets, shown big (chosen in data/multi-volume-sets.json). */}
      <FeaturedSets sets={homeFeaturedSets} total={volumeSets.length} />

      {/* Practical visitor information, as every library site has (details in src/lib/library.ts). */}
      <section className="container section visit-band" aria-labelledby="visit-title">
        <div className="section-head">
          <h2 id="visit-title">Visit us</h2>
          <Link href="/visit/" className="see-all">
            How to find a book
          </Link>
        </div>
        <VisitInfo />
      </section>
    </>
  );
}
