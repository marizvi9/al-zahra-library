import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import BrowseClient from "@/components/BrowseClient";
import BrowseIntro from "@/components/BrowseIntro";
import { allShelfSections, books, shelves, toListItem } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Browse",
  description: "Browse every book in the Al-Zahra Library, shelf by shelf.",
};

export default function BrowsePage() {
  const sections = allShelfSections().map(({ books: list, ...s }) => ({ ...s, items: list.map(toListItem) }));
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Browse" }]} />
      <BrowseIntro />
      <ShelfTabs shelves={shelves} active="" />
      <section className="page-head arch-band shelf-band" aria-labelledby="band-title">
        <h2 id="band-title">All shelves</h2>
        <p className="lede">
          {books.length} books on {shelves.length} shelves, with a short description of each subject.
        </p>
      </section>
      <BrowseClient sections={sections} scope="all shelves" chipLabel="Shelves" />
    </div>
  );
}
