import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import ExploreClient from "@/components/ExploreClient";
import ExploreIntro from "@/components/ExploreIntro";
import CategoryCard from "@/components/CategoryCard";
import { allShelfSections, books, categories, shelves, toListItem } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Explore",
  description: "Explore every book in the Al-Zahra Library, shelf by shelf.",
};

export default function ExplorePage() {
  const sections = allShelfSections().map(({ books: list, ...s }) => ({ ...s, items: list.map(toListItem) }));
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Explore" }]} />
      <ExploreIntro />
      <ShelfTabs shelves={shelves} active="" />
      <section className="page-head arch-band shelf-band" aria-labelledby="band-title">
        <h2 id="band-title">All shelves</h2>
        <p className="lede">
          {books.length} books in {categories.length} subjects. Choose <strong>Cards</strong> to see each subject
          with its description, or <strong>List</strong> for shelf buttons and every book.
        </p>
      </section>
      <ExploreClient
        sections={sections}
        scope="all shelves"
        chipLabel="Shelves"
        cards={
          // The big subject blocks from the old Browse page. Each opens its shelf.
          <ul className="card-grid browse-cards" aria-label="Subjects">
            {categories.map((c) => (
              <li key={c.slug}>
                <CategoryCard category={c} />
              </li>
            ))}
          </ul>
        }
      />
    </div>
  );
}
