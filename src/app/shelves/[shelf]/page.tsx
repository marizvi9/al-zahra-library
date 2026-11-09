import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookList from "@/components/BookList";
import ShelfTabs from "@/components/ShelfTabs";
import { getShelf, shelfSections, shelves, toListItem } from "@/lib/catalog";

type Props = { params: Promise<{ shelf: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return shelves.map((s) => ({ shelf: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getShelf((await params).shelf);
  return { title: s ? (s.number ? `Shelf ${s.number}` : s.label) : undefined };
}

export default async function ShelfPage({ params }: Props) {
  const shelf = getShelf((await params).shelf);
  if (!shelf) notFound();
  const sections = shelfSections(shelf.slug);

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shelves", href: "/shelves/" },
          { label: shelf.number ? `Shelf ${shelf.number}` : shelf.label },
        ]}
      />
      <ShelfTabs shelves={shelves} active={shelf.slug} />

      <header className="page-head arch-band">
        <p className="eyebrow">{shelf.number ? `Shelf ${shelf.number}` : "Not yet shelved by number"}</p>
        <h1>{shelf.categories.join(", ")}</h1>
        <p className="lede">
          {shelf.count} {shelf.count === 1 ? "book" : "books"}
          {sections.length > 1 ? ` in ${sections.length} sections` : ""}
        </p>
      </header>

      {sections.map((sec) => (
        <section key={sec.key} className="section-tight" aria-labelledby={`sec-${sec.key}`}>
          <h2 id={`sec-${sec.key}`} className="shelf-section-heading">
            {sec.heading} <span className="chip-count">{sec.books.length}</span>
          </h2>
          <BookList items={sec.books.map(toListItem)} />
        </section>
      ))}
    </div>
  );
}
