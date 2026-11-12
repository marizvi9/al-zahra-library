import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryCard from "@/components/CategoryCard";
import CategoryCover from "@/components/CategoryCover";
import { categories } from "@/lib/catalog";
import { volumeSets } from "@/lib/sets";

export const metadata: Metadata = {
  title: "Explore",
  description: "Every subject in the Al-Zahra Islamic Library, with a short description of each.",
};

export default function ExplorePage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
      <h1>Explore</h1>
      <p className="lede">
        Pick a subject to see its books. The shelf number on each card matches the start of the call
        number on the spine. To see the library shelf by shelf, use{" "}
        <Link href="/shelves/">Shelves</Link>.
      </p>
      <ul className="card-grid">
        {categories.map((c) => (
          <li key={c.slug}>
            <CategoryCard category={c} />
          </li>
        ))}
        {/* Multi-volume sets are not a shelf category: this card opens the list of sets. */}
        <li>
          <Link href="/sets/" className="category-card">
            <CategoryCover slug="multi-volume-sets" number={null} caption="SETS OF VOLUMES" className="category-card-cover" />
            <span className="category-card-body">
              <span className="category-card-name">Multi-Volume Sets</span>
              <span className="category-card-desc">
                Works that come in several volumes or parts, gathered in one place, with the volumes the library holds in order.
              </span>
              <span className="category-card-count">{volumeSets.length} sets</span>
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
