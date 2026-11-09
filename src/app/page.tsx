import Link from "next/link";
import Girih from "@/components/Girih";
import SearchBox from "@/components/SearchBox";
import CategoryCard from "@/components/CategoryCard";
import FeaturedSlider from "@/components/FeaturedSlider";
import { withBase } from "@/lib/paths";
import { featuredSlides } from "@/lib/featured";
import { books, featuredCategories, moreToExplore } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-arch">
          <Girih className="girih-hero" />
          <div className="hero-content">
            <div className="hero-title-row">
              {/* Logo placeholder: replace public/logos/al-zahra-logo.svg with the real logo. */}
              <img
                src={withBase("/logos/al-zahra-logo.svg")}
                alt="Al-Zahra Library logo"
                width={88}
                height={88}
                className="hero-logo"
              />
              <h1 id="hero-title">
                Welcome to the <span className="nowrap">Al-Zahra</span> Library
              </h1>
            </div>
            <p className="hero-sub">at the Islamic Education Center</p>
            <p className="hero-lede">
              Search {books.length} books on faith, history, law, thought and more.
            </p>
            <SearchBox large />
          </div>
        </div>
      </section>

      <div className="container section">
        <FeaturedSlider slides={featuredSlides} />
      </div>

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
          {moreToExplore.map((c) => (
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
