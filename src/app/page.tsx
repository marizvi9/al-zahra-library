import Link from "next/link";
import Girih from "@/components/Girih";
import SearchBox from "@/components/SearchBox";
import CategoryCard from "@/components/CategoryCard";
import { books, categories, featuredCategories } from "@/lib/catalog";

export default function HomePage() {
  const others = categories.filter((c) => !featuredCategories.includes(c));
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-arch">
          <Girih className="girih-hero" />
          <div className="hero-content">
            <p className="eyebrow">Islamic Education Center</p>
            <h1 id="hero-title">Al-Zahra Library</h1>
            <p className="hero-lede">
              Search {books.length} books on faith, history, law, thought and more.
            </p>
            <SearchBox large />
          </div>
        </div>
      </section>

      <section className="container section" aria-labelledby="featured-title">
        <div className="section-head">
          <h2 id="featured-title">Featured categories</h2>
          <Link href="/categories/" className="see-all">
            All categories
          </Link>
        </div>
        <ul className="card-grid">
          {featuredCategories.map((c) => (
            <li key={c.slug}>
              <CategoryCard category={c} />
            </li>
          ))}
        </ul>
      </section>

      <section className="container section" aria-labelledby="more-title">
        <h2 id="more-title">More to explore</h2>
        <ul className="chip-list">
          {others.map((c) => (
            <li key={c.slug}>
              <Link href={`/categories/${c.slug}/`} className="chip">
                {c.name} <span className="chip-count">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
