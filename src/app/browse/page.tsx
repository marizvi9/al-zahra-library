import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import BrowseClient from "@/components/BrowseClient";
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
      <ShelfTabs shelves={shelves} active="" />
      <header className="page-head arch-band">
        <p className="eyebrow">All shelves</p>
        <h1>Browse the library</h1>
        <p className="lede">
          Books are shelved by number: the first part of a call number (for example <strong>300</strong> in
          300&nbsp;·&nbsp;50) is the shelf. Pick a shelf above, or search all {books.length} books below.
        </p>
      </header>
      <BrowseClient sections={sections} scope="all shelves" chipLabel="Shelves" />
    </div>
  );
}
