import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookList from "@/components/BookList";
import AuthorPortrait from "@/components/AuthorPortrait";
import { bioFor } from "@/lib/authorPhotos";

/** "https://en.wikipedia.org/wiki/Ali_Shariati" → "Wikipedia: Ali Shariati". */
function sourceName(url: string) {
  const m = /wikipedia\.org\/wiki\/(.+)$/.exec(url);
  return m ? `Wikipedia: ${decodeURIComponent(m[1]).replace(/_/g, " ")}` : new URL(url).hostname;
}
import { authors, categories, getAuthor, toListItem } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getAuthor((await params).slug);
  return a ? { title: a.name, description: `${a.count === 1 ? "1 book" : `${a.count} books`} by ${a.name} in the Al-Zahra Islamic Library.` } : {};
}

export default async function AuthorPage({ params }: Props) {
  const author = getAuthor((await params).slug);
  if (!author) notFound();
  // The subjects this author's books are in, most first.
  const counts = new Map<string, number>();
  for (const b of author.books) counts.set(b.categorySlug, (counts.get(b.categorySlug) ?? 0) + 1);
  const subjects = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([slug, n]) => ({ cat: categories.find((c) => c.slug === slug)!, n }));
  const bio = bioFor(author.name);
  const spellings = [...new Set(author.books.map((b) => b.author!))].filter((s) => s !== author.name);

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Authors", href: "/authors/" }, { label: author.name }]} />
      <header className="author-head">
        <AuthorPortrait name={author.name} />
        <div className="author-head-text">
          <h1 dir="auto">{author.name}</h1>
          {bio && (
            <div className="author-bio">
              <p>{bio.text}</p>
              <p className="author-bio-source">
                Source{bio.sources.length > 1 ? "s" : ""}:{" "}
                {bio.sources.map((u, i) => (
                  <span key={u}>
                    {i > 0 && ", "}
                    <a href={u} rel="noopener">
                      {sourceName(u)}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          )}
          <p className="author-data-line">
            Author of {author.count === 1 ? "1 book" : `${author.count} books`} in the Al-Zahra Islamic Library, in{" "}
            {subjects.map(({ cat, n }, i) => (
              <span key={cat.slug}>
                {i > 0 && (i === subjects.length - 1 ? " and " : ", ")}
                <Link href={`/explore/${cat.slug}/`}>{cat.name}</Link> ({n})
              </span>
            ))}
            .
          </p>
          {spellings.length > 0 && <p className="small muted">Also spelled in the catalogue: {spellings.join("; ")}.</p>}
        </div>
      </header>
      <BookList items={author.books.map(toListItem)} showCategory currentAuthor={author.slug} />
    </div>
  );
}
