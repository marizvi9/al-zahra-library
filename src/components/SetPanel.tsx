// On a book's own page, when it is one volume of a set: the set's name, links to the previous and next
// volume, and the full list of volumes (each linked; the one you are on is marked; missing ones are noted).
import Link from "next/link";
import type { VolumeSet } from "@/lib/sets";
import { neighbours } from "@/lib/sets";

export default function SetPanel({ set, bookId }: { set: VolumeSet; bookId: number }) {
  const { prev, next, index } = neighbours(set, bookId);
  const series = set.kind === "series";
  return (
    <nav className="set-panel" aria-labelledby="set-panel-title">
      <p id="set-panel-title" className="set-panel-title">
        <span className="set-label-icon" aria-hidden="true">▤</span>{" "}
        {series ? "Part of a series" : "Part of a multi-volume set"}:{" "}
        <Link href={`/sets/${set.slug}/`} dir="auto">
          {set.name}
        </Link>
      </p>
      <ol className="set-panel-list">
        {set.volumes.map((v, i) => (
          <li key={v.label}>
            {i === index ? (
              <span className="set-panel-here" aria-current="page">
                {v.label} <span className="visually-hidden">(this book)</span>
              </span>
            ) : (
              <Link href={`/books/${v.books[0].slug}/`}>{v.label}</Link>
            )}
          </li>
        ))}
      </ol>
      {set.missing && <p className="small muted set-panel-missing">Not in the catalogue: {set.missing}.</p>}
      <p className="set-panel-steps">
        {prev ? (
          <Link href={`/books/${prev.books[0].slug}/`} rel="prev">
            ← Previous: {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/books/${next.books[0].slug}/`} rel="next">
            Next: {next.label} →
          </Link>
        )}
      </p>
      <p className="small">
        <Link href={`/sets/${set.slug}/`}>See the whole {series ? "series" : "set"} →</Link>
      </p>
    </nav>
  );
}
