import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import { shelves } from "@/lib/catalog";

export const metadata: Metadata = { title: "Browse by shelf" };

export default function ShelvesPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shelves" }]} />
      <h1>Browse by shelf</h1>
      <p className="lede">
        Books are shelved by number. Pick a shelf to see everything on it, section by section.
        The first part of a book&rsquo;s call number (for example <strong>1100</strong> in
        1100&nbsp;·&nbsp;10) is its shelf.
      </p>
      <ShelfTabs shelves={shelves} />
      <ul className="card-grid">
        {shelves.map((s) => (
          <li key={s.slug}>
            <Link href={`/shelves/${s.slug}/`} className="category-card shelf-card-link">
              <span className="category-card-top">
                <span className="shelf-no">{s.number ? "Shelf" : " "}</span>
              </span>
              <span className="category-card-name">{s.label}</span>
              <span className="category-card-desc">{s.categories.join(", ")}</span>
              <span className="category-card-count">
                {s.count} {s.count === 1 ? "book" : "books"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
