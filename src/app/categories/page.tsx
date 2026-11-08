import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryCard from "@/components/CategoryCard";
import { categories } from "@/lib/catalog";

export const metadata: Metadata = { title: "Browse categories" };

export default function CategoriesPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories" }]} />
      <h1>Browse by category</h1>
      <p className="lede">
        Books are shelved by category number. The shelf number on each card matches the start of
        the call number on the spine.
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
