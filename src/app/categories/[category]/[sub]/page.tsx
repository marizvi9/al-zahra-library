import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookList from "@/components/BookList";
import { booksInSubCategory, categories, getCategory, toListItem } from "@/lib/catalog";

type Props = { params: Promise<{ category: string; sub: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return categories.flatMap((c) => c.subCategories.map((s) => ({ category: c.slug, sub: s.slug })));
}

function lookup(catSlug: string, subSlug: string) {
  const cat = getCategory(catSlug);
  const sub = cat?.subCategories.find((s) => s.slug === subSlug);
  return { cat, sub };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const { cat, sub } = lookup(p.category, p.sub);
  return { title: sub && cat ? `${sub.name} – ${cat.name}` : undefined };
}

export default async function SubCategoryPage({ params }: Props) {
  const p = await params;
  const { cat, sub } = lookup(p.category, p.sub);
  if (!cat || !sub) notFound();
  const list = booksInSubCategory(cat.slug, sub.slug);

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Browse by categories", href: "/categories/" },
          { label: cat.name, href: `/categories/${cat.slug}/` },
          { label: sub.name },
        ]}
      />
      <header className="page-head arch-band">
        {cat.number && (
          <p className="eyebrow">
            Shelf {cat.number}
            {sub.number ? ` · ${sub.number}` : ""}
          </p>
        )}
        <h1>{sub.name}</h1>
        <p className="lede">
          {cat.name} · {list.length} {list.length === 1 ? "book" : "books"}
        </p>
      </header>
      <BookList items={list.map(toListItem)} />
    </div>
  );
}
