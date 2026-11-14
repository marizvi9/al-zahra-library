import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import VisitInfo from "@/components/VisitInfo";
import { books, shelves } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Visit the Library",
  description: "Where to find the Al-Zahra Islamic Library, opening hours, and how to find a book on its shelves.",
};

// A real book to use as the example shelf number.
const example = books.find((b) => b.callNumber === "500 · 10 · 1") ?? books.find((b) => b.callNumber);

export default function VisitPage() {
  const numbered = shelves.filter((s) => s.number);
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Visit" }]} />
      <header className="page-head arch-band">
        <h1>Visit the Library</h1>
        <p className="lede">The Al-Zahra Islamic Library is at the Islamic Education Center of Houston. Everyone is welcome to look up books here first, then find them on the shelves.</p>
      </header>

      <section className="section visit-page-info" aria-label="Location, hours and contact">
        <VisitInfo headingLevel={2} />
      </section>

      <section className="section" aria-labelledby="find-title">
        <h2 id="find-title">How to find a book</h2>
        <ol className="find-steps">
          <li>
            <span className="find-step-no" aria-hidden="true">1</span>
            <div>
              <h3>Look it up</h3>
              <p>
                <Link href="/search/">Search the catalogue</Link> by title, author or subject, or browse by <Link href="/explore/">subject</Link>.
              </p>
            </div>
          </li>
          <li>
            <span className="find-step-no" aria-hidden="true">2</span>
            <div>
              <h3>Note its shelf number</h3>
              {example && (
                <p>
                  Every book page shows a shelf number. For example, <Link href={`/books/${example.slug}/`}>{example.title}</Link> is{" "}
                  <span className="shelf-number shelf-number-inline">{example.callNumber}</span>: shelf {example.catNo} ({example.category}), section {example.subCatNo}
                  {example.subCategory && example.subCategory !== "General" ? ` (${example.subCategory})` : ""}, book {example.bookNo}.
                </p>
              )}
            </div>
          </li>
          <li>
            <span className="find-step-no" aria-hidden="true">3</span>
            <div>
              <h3>Go to the shelf</h3>
              <p>
                The shelves are arranged by number. <Link href="/shelves/">See what is on each shelf</Link>.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="section" aria-labelledby="shelf-guide-title">
        <h2 id="shelf-guide-title">Shelf guide</h2>
        <table className="subject-index">
          <thead>
            <tr>
              <th scope="col">Shelf</th>
              <th scope="col">Subjects</th>
              <th scope="col" className="num">
                Books
              </th>
            </tr>
          </thead>
          <tbody>
            {numbered.map((s) => (
              <tr key={s.slug}>
                <td>
                  <Link href={`/shelves/${s.slug}/`} className="subject-index-shelf">
                    {s.number}
                  </Link>
                </td>
                <td>{s.categories.join(", ")}</td>
                <td className="num">{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
