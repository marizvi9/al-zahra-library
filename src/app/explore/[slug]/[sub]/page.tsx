import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookGrid from "@/components/BookGrid";
import SubTopicNav from "@/components/SubTopicNav";
import SubTopicPager, { type PagerLink } from "@/components/SubTopicPager";
import { booksInSubCategory, categories, getCategory, subTopicNeighbours, subTopicText, toGridItem } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string; sub: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return categories.flatMap((c) => c.subCategories.map((s) => ({ slug: c.slug, sub: s.slug })));
}

function lookup(catSlug: string, subSlug: string) {
  const cat = getCategory(catSlug);
  const sub = cat?.subCategories.find((s) => s.slug === subSlug);
  return { cat, sub };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const { cat, sub } = lookup(p.slug, p.sub);
  return sub && cat ? { title: `${sub.name} – ${cat.name}`, description: subTopicText(cat, sub) } : {};
}

export default async function SubCategoryPage({ params }: Props) {
  const p = await params;
  const { cat, sub } = lookup(p.slug, p.sub);
  if (!cat || !sub) notFound();
  const list = booksInSubCategory(cat.slug, sub.slug);
  const many = cat.subCategories.length > 1;
  const { prev, next, nextCategory } = subTopicNeighbours(cat, sub.slug);
  const prevCategory = categories[categories.indexOf(cat) - 1];
  // Sub-topic buttons; when a category has just "General", the buttons go to the neighbouring categories.
  const prevLink: PagerLink = prev
    ? { href: `/explore/${cat.slug}/${prev.slug}/`, name: prev.name }
    : !many && prevCategory
      ? { href: `/explore/${prevCategory.slug}/`, name: prevCategory.name, kind: "category" }
      : null;
  const nextLink: PagerLink = next
    ? { href: `/explore/${cat.slug}/${next.slug}/`, name: next.name }
    : nextCategory
      ? { href: `/explore/${nextCategory.slug}/`, name: nextCategory.name, kind: "category" }
      : null;

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Explore", href: "/explore/" },
          { label: cat.name, href: `/explore/${cat.slug}/` },
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
        <p>{subTopicText(cat, sub)}</p>
      </header>
      {many && <SubTopicNav cat={cat} current={sub.slug} />}
      <BookGrid items={list.map(toGridItem)} paged={sub.name !== "General"} />
      <SubTopicPager prev={prevLink} next={nextLink} />
    </div>
  );
}
