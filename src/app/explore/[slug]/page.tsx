import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookGrid from "@/components/BookGrid";
import SubTopicNav from "@/components/SubTopicNav";
import Redirect from "@/components/Redirect";
import CategoryCover from "@/components/CategoryCover";
import { booksInCategory, categories, getCategory, shelves, toGridItem } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

// One page per category, built ahead of time. Shelf numbers (/explore/300/) were the
// Shelves pages' old addresses, so those forward to /shelves/300/.
export const dynamicParams = false;
export function generateStaticParams() {
  return [...categories.map((c) => ({ slug: c.slug })), ...shelves.map((s) => ({ slug: s.slug }))];
}
const isOldShelfAddress = (slug: string) => !getCategory(slug) && shelves.some((s) => s.slug === slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  if (isOldShelfAddress(slug)) return { title: "Shelves", robots: { index: false } };
  const cat = getCategory(slug);
  return { title: cat?.name, description: cat?.description };
}

export default async function CategoryPage({ params }: Props) {
  const slug = (await params).slug;
  if (isOldShelfAddress(slug)) return <Redirect to={`/shelves/${slug}/`} />;
  const cat = getCategory(slug);
  if (!cat) notFound();
  const list = booksInCategory(cat.slug);
  const showSubs = cat.subCategories.length > 1 || cat.subCategories[0]?.name !== "General";

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Explore", href: "/explore/" }, { label: cat.name }]} />
      <header className="category-hero">
        <CategoryCover slug={cat.slug} number={cat.number} className="category-hero-cover" />
        <div className="category-hero-text">
          <h1>{cat.name}</h1>
          {cat.description && <p className="lede">{cat.description}</p>}
          <p className="category-hero-count">
            {list.length} {list.length === 1 ? "book" : "books"}
            {cat.number ? ` · Shelf ${cat.number}` : ""}
          </p>
        </div>
      </header>

      {showSubs && (
        <section aria-labelledby="subs-title" className="section-tight">
          <h2 id="subs-title">Sub-topics</h2>
          <SubTopicNav cat={cat} />
        </section>
      )}

      <section aria-labelledby="books-title" className="section-tight">
        <h2 id="books-title">
          All {list.length} {list.length === 1 ? "book" : "books"}
        </h2>
        <BookGrid items={list.map(toGridItem)} showCategory={showSubs} />
      </section>
    </div>
  );
}
