import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { authors } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Authors",
  description: "Authors with two or more books in the Al-Zahra Islamic Library, A to Z.",
};

// A–Z by surname ("Ali Shariati" is under S).
const letterOf = (name: string) => {
  const last = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).pop()!.replace(/^(al|as|at|an|ar|ash)-/i, "");
  return last[0].toUpperCase();
};

export default function AuthorsPage() {
  const byLetter = new Map<string, typeof authors>();
  for (const a of authors) {
    const l = letterOf(a.name);
    if (!byLetter.has(l)) byLetter.set(l, []);
    byLetter.get(l)!.push(a);
  }
  const letters = [...byLetter.keys()];

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Authors" }]} />
      <h1>Authors</h1>
      <p className="lede">
        The {authors.length} authors with two or more books in the library, A to Z by surname. Different
        spellings of the same name are listed together.
      </p>
      <nav className="letter-jump" aria-label="Jump to a letter">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`}>
            {l}
          </a>
        ))}
      </nav>
      {letters.map((l) => (
        <section key={l} id={`letter-${l}`} className="author-letter" aria-labelledby={`h-${l}`}>
          <h2 id={`h-${l}`}>{l}</h2>
          <ul className="author-list">
            {byLetter.get(l)!.map((a) => (
              <li key={a.slug}>
                <Link href={`/authors/${a.slug}/`}>
                  <span dir="auto">{a.name}</span> <span className="chip-count">{a.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
