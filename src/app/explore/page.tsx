import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryCard from "@/components/CategoryCard";
import { categories } from "@/lib/catalog";

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
      </ul>
    </div>
  );
}
