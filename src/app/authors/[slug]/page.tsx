import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookList from "@/components/BookList";
import { authors, categories, getAuthor, toListItem } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getAuthor((await params).slug);
  return a ? { title: a.name, description: `${a.count} books by ${a.name} in the Al-Zahra Islamic Library.` } : {};
}

export default async function AuthorPage({ params }: Props) {
  const author = getAuthor((await params).slug);
  if (!author) notFound();
  // The subjects this author's books are in, most first.
  const counts = new Map<string, number>();
  for (const b of author.books) counts.set(b.categorySlug, (counts.get(b.categorySlug) ?? 0) + 1);
  const subjects = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([slug, n]) => ({ cat: categories.find((c) => c.slug === slug)!, n }));
  const spellings = [...new Set(author.books.map((b) => b.author!))].filter((s) => s !== author.name);

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Authors", href: "/authors/" }, { label: author.name }]} />
      <header className="author-head">
        <h1 dir="auto">{author.name}</h1>
        <p className="lede">
          {author.count} books in the library, in{" "}
          {subjects.map(({ cat, n }, i) => (
            <span key={cat.slug}>
              {i > 0 && (i === subjects.length - 1 ? " and " : ", ")}
              <Link href={`/explore/${cat.slug}/`}>{cat.name}</Link> ({n})
            </span>
          ))}
          .
        </p>
        {spellings.length > 0 && <p className="small muted">Also spelled in the catalogue: {spellings.join("; ")}.</p>}
      </header>
      <BookList items={author.books.map(toListItem)} showCategory />
    </div>
  );
}
