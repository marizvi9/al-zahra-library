// A book's credit line with each author's name linked to their page, keeping the
// catalogue's own wording ("Compiled by A & B", "X Translated by: Y").
// On an author's own page their name is left as plain text (pass `current`).
import Link from "next/link";
import type { CreditPart } from "@/lib/catalog";

export default function Credit({ parts, current }: { parts: CreditPart[]; current?: string }) {
  return (
    <>
      {parts.map((p, i) =>
        p.slug && p.slug !== current ? (
          <Link key={i} href={`/authors/${p.slug}/`} className="author-link">
            {p.text}
          </Link>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
