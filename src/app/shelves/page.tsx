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
  const sections = allShelfSections().map(({ books: list, subject, ...s }) => ({
    ...s,
    description: subject,
    items: list.map(toListItem),
  }));
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shelves" }]} />
      <ShelvesIntro />
      <ShelfTabs shelves={shelves} active="" />
      <section className="shelf-band" aria-labelledby="band-title">
        <h2 id="band-title">All shelves</h2>
        <p>
          {books.length} books on {shelves.length} shelves, in catalogue order: by shelf number, then by section number (300 · 10, 300 · 20 …). Click a section to see just its books, or use the filter.
        </p>
      </section>
      <ShelfClient sections={sections} scope="all shelves" chipLabel="Sections" />
    </div>
  );
}
