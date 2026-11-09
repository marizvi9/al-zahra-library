import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookList from "@/components/BookList";
import { booksInCategory, categories, getCategory, toListItem } from "@/lib/catalog";

type Props = { params: Promise<{ category: string }> };

// Build one page per category ahead of time.
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategory((await params).category);
  return { title: cat?.name, description: cat?.description };
}

export default async function CategoryPage({ params }: Props) {
  const cat = getCategory((await params).category);
  if (!cat) notFound();
  const list = booksInCategory(cat.slug);
  const showSubs = cat.subCategories.length > 1 || cat.subCategories[0]?.name !== "General";

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Browse by categories", href: "/categories/" }, { label: cat.name }]} />
      <header className="page-head arch-band">
        {cat.number && <p className="eyebrow">Shelf {cat.number}</p>}
        <h1>{cat.name}</h1>
        {cat.description && <p className="lede">{cat.description}</p>}
      </header>

      {showSubs && (
        <section aria-labelledby="subs-title" className="section-tight">
          <h2 id="subs-title">Sub-categories</h2>
          <ul className="chip-list">
            {cat.subCategories.map((s) => (
              <li key={s.slug}>
                <Link href={`/categories/${cat.slug}/${s.slug}/`} className="chip">
                  {s.number && cat.number && <span className="chip-no">{cat.number} · {s.number}</span>}
                  {s.name} <span className="chip-count">{s.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="books-title" className="section-tight">
        <h2 id="books-title">
          All {list.length} {list.length === 1 ? "book" : "books"}
        </h2>
        <BookList
          items={list.map(toListItem)}
          showCategory={showSubs}
        />
      </section>
    </div>
  );
}
