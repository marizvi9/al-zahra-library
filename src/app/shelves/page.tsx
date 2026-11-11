import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import ShelfClient from "@/components/ShelfClient";
import ShelvesIntro from "@/components/ShelvesIntro";
import { allShelfSections, books, shelves, toListItem } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shelves",
  description: "Every book in the Al-Zahra Islamic Library, shelf by shelf, as they stand in the library.",
};

export default function ShelvesPage() {
  const sections = allShelfSections().map(({ books: list, ...s }, i) => {
    const shelf = shelves[i];
    return {
      ...s,
      tile: { number: shelf.number, name: shelf.number ? shelf.categories.join(", ") : "No shelf number" },
      description: shelf.number ? s.description : `Not given a shelf number yet: ${shelf.categories.join(", ")}.`,
      items: list.map(toListItem),
    };
  });
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shelves" }]} />
      <ShelvesIntro />
      <ShelfTabs shelves={shelves} active="" />
      <section className="shelf-band" aria-labelledby="band-title">
        <h2 id="band-title">All shelves</h2>
        <p>
          {books.length} books on {shelves.length} shelves. Click a shelf to see just its books, or use the filter.
        </p>
      </section>
      <ShelfClient sections={sections} scope="all shelves" chipLabel="Shelves" />
    </div>
  );
}
