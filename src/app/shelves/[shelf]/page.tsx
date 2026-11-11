import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShelfTabs from "@/components/ShelfTabs";
import ShelfClient from "@/components/ShelfClient";
import ShelvesIntro from "@/components/ShelvesIntro";
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
  const categorySlug = categories.find((c) => c.name === shelf.categories[0])?.slug;
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
          { label: "Shelves", href: "/shelves/" },
          { label: shelf.number ? `Shelf ${shelf.number}` : "No shelf number" },
        ]}
      />
      <ShelvesIntro />
      <ShelfTabs shelves={shelves} active={shelf.slug} />
      <section className="shelf-band" aria-labelledby="band-title">
        <h2 id="band-title">
          <span className="shelf-band-no">{shelf.number ? `Shelf ${shelf.number}` : "No shelf number"}</span>{" "}
          {shelf.categories.join(", ")}
        </h2>
        {description && <p>{description}</p>}
      </section>
      <ShelfClient
        sections={sections}
        scope="this shelf"
        chipLabel={shelf.number ? "Sections" : "Subjects"}
        searchCategory={shelf.number ? categorySlug : undefined}
        chipsAreCategories={!shelf.number}
      />
    </div>
  );
}
