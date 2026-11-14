import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { authors, authorsByLetter } from "@/lib/catalog";
import AuthorAvatar from "@/components/AuthorAvatar";
import AuthorFilter from "@/components/AuthorFilter";
import { foldName } from "@/lib/foldName";
import { plainName } from "@/lib/authorPhotos";
import authorNames from "@data/author-names.json";

const spellings = (authorNames as { groups: Record<string, string[]> }).groups;

export const metadata: Metadata = {
  title: "Authors",
  description: "Every author in the Al-Zahra Islamic Library, A to Z.",
};

export default function AuthorsPage() {
  const byLetter = authorsByLetter(); // A–Z by surname ("Ali Shariati" is under S)
  const letters = [...byLetter.keys()];

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Authors" }]} />
      <h1>Authors</h1>
      <p className="lede">
        All {authors.length} authors in the library, A to Z by surname. Different
        spellings of the same name are listed together, and titles such as Ayatullah are left out here.
      </p>
      <AuthorFilter listId="author-index" total={authors.length} />
      <nav className="letter-jump" aria-label="Jump to a letter">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`}>
            {l}
          </a>
        ))}
      </nav>
      <div id="author-index">
      {letters.map((l) => (
        <section key={l} id={`letter-${l}`} className="author-letter" aria-labelledby={`h-${l}`}>
          <h2 id={`h-${l}`}>{l}</h2>
          <ul className="author-list">
            {byLetter.get(l)!.map((a) => (
              <li key={a.slug} data-search={foldName([a.display, a.name, ...(spellings[a.name] ?? [])].join(" "))}>
                <Link href={`/authors/${a.slug}/`}>
                  <AuthorAvatar name={a.name} size={36} />
                  <span dir="auto" className="author-list-name">
                    {plainName(a.name)}
                  </span>{" "}
                  <span className="chip-count">{a.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      </div>
      <p className="small muted photo-credits-link">
        Author photos are from Wikimedia Commons (free licences), WikiShia and a few authors’ official websites, each used with credit.{" "}
        <Link href="/authors/photo-credits/">See every photo&rsquo;s credit and licence</Link>.
      </p>
    </div>
  );
}
