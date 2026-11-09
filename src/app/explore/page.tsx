import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import ExploreClient from "@/components/ExploreClient";
import ExploreIntro from "@/components/ExploreIntro";
import { allShelfSections, books, shelves, toListItem } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Explore by shelves",
  description: "Explore every book in the Al-Zahra Library, shelf by shelf.",
};

export default function ExplorePage() {
  const sections = allShelfSections().map(({ books: list, ...s }, i) => {
    const shelf = shelves[i];
    return {
      ...s,
      tile: { number: shelf.number, name: shelf.number ? shelf.categories.join(", ") : "No shelf number" },
      description: shelf.number ? s.description : `${shelf.categories.join(", ")}: not given a shelf number yet.`,
      items: list.map(toListItem),
    };
  });
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Explore by shelves" }]} />
      <ExploreIntro />
      <ShelfTabs shelves={shelves} active="" />
      <section className="page-head arch-band shelf-band" aria-labelledby="band-title">
        <h2 id="band-title">All shelves</h2>
        <p className="lede">
          {books.length} books on {shelves.length} shelves. Click a shelf to see just its books, or use the filter.
        </p>
      </section>
      <ExploreClient sections={sections} scope="all shelves" chipLabel="Shelves" />
    </div>
  );
}
