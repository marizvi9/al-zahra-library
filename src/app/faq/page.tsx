import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AddressLink, IecLink } from "@/components/LibraryLinks";
import { HoursList } from "@/components/VisitInfo";
import { CONTACT_EMAIL } from "@/lib/library";
import { books, categories } from "@/lib/catalog";

export const metadata: Metadata = { title: "FAQ", description: "Frequently asked questions about the Al-Zahra Islamic Library and its catalog." };

// Only facts the library has confirmed. Anything not decided yet (such as hours or borrowing)
// says so and points to Contact Us, rather than guessing.
export default function FaqPage() {
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: "Where is the library?",
      a: (
        <p>
          At the <IecLink />, <AddressLink />.
        </p>
      ),
    },
    {
      q: "When is the library open?",
      a: <HoursList />,
    },
    {
      q: "Can I borrow books?",
      a: (
        <p>
          Please <Link href="/contact/">contact us</Link> or ask at the library about borrowing.
        </p>
      ),
    },
    {
      q: "How do I find a book on the shelves?",
      a: (
        <p>
          Look the book up in the catalog, note its shelf number (for example 500 · 10 · 1 means shelf 500, section 10, book 1), then go to that shelf.{" "}
          <Link href="/visit/">More on the Visit page</Link>.
        </p>
      ),
    },
    {
      q: "What is in the collection?",
      a: (
        <p>
          {books.length} books in {categories.length} subjects, from Quran and Hadith to history, fiqh, philosophy and biography. <Link href="/explore/">Browse by subject</Link>.
        </p>
      ),
    },
    {
      q: "Where do the book descriptions and covers come from?",
      a: (
        <p>
          Descriptions are quoted from their sources, which are named on each book page, or are short library summaries marked as such. Where no cover picture was found, the library draws a plain cover with the title and author.
        </p>
      ),
    },
    {
      q: "I found a mistake. How do I report it?",
      a: (
        <p>
          Please email <a href={`mailto:${CONTACT_EMAIL}`} className="break-anywhere">{CONTACT_EMAIL}</a> with the book's title or a link to its page.
        </p>
      ),
    },
  ];
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <header className="page-head arch-band">
        <h1>FAQ</h1>
        <p className="lede">Answers to common questions about the library and this catalog.</p>
      </header>
      <div className="faq-list">
        {faqs.map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <div className="faq-answer">{f.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
