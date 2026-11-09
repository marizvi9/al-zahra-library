import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import BrowseClient from "@/components/BrowseClient";
import { categories, getShelf, shelfSections, shelves, toListItem } from "@/lib/catalog";

type Props = { params: Promise<{ shelf: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return shelves.map((s) => ({ shelf: s.slug }));
}

const nameOf = (s: { number: string | null; categories: string[] }) =>
  s.number ? `Shelf ${s.number} · ${s.categories.join(", ")}` : "Books with no shelf number";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getShelf((await params).shelf);
  return s ? { title: nameOf(s) } : {};
}

export default async function ShelfPage({ params }: Props) {
  const shelf = getShelf((await params).shelf);
  if (!shelf) notFound();
  const sections = shelfSections(shelf.slug).map(({ books: list, ...s }) => ({ ...s, items: list.map(toListItem) }));
  // The category description from the old Browse page (numbered shelves hold one category each).
  const description = shelf.number
    ? categories
        .filter((c) => shelf.categories.includes(c.name))
        .map((c) => c.description)
        .filter(Boolean)
        .join(" ")
    : "These books have not been given a shelf number yet. They are grouped by category below; please ask at the library desk to find them.";

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Browse", href: "/browse/" },
          { label: shelf.number ? `Shelf ${shelf.number}` : "No shelf number" },
        ]}
      />
      <ShelfTabs shelves={shelves} active={shelf.slug} />
      <header className="page-head arch-band">
        <p className="eyebrow">{shelf.number ? `Shelf ${shelf.number}` : "No shelf number"}</p>
        <h1>{shelf.categories.join(", ")}</h1>
        {description && <p className="lede">{description}</p>}
      </header>
      <BrowseClient sections={sections} scope="this shelf" chipLabel="Sections" />
    </div>
  );
}
