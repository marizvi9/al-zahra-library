// Small "← Prophets" and "Christianity →" buttons at the bottom of a page, going to the
// previous / next sub-topic (or category). When there is nothing before, the Previous button
// is shown greyed out and can't be pressed; the same goes for Next at the very end.
import Link from "next/link";

export type PagerLink = { href: string; name: string; kind?: string } | null;

export default function SubTopicPager({ prev, next }: { prev: PagerLink; next: PagerLink }) {
  const label = (dir: string, l: NonNullable<PagerLink>) => `${dir}${l.kind ? ` ${l.kind}` : ""}: ${l.name}`;
  return (
    <nav className="pager" aria-label="Previous and next">
      {prev ? (
        <Link href={prev.href} className="pager-btn" rel="prev" aria-label={label("Previous", prev)}>
          <span aria-hidden="true">←</span> {prev.name}
        </Link>
      ) : (
        <span className="pager-btn is-disabled" aria-disabled="true">
          <span aria-hidden="true">←</span> Previous
        </span>
      )}
      {next ? (
        <Link href={next.href} className="pager-btn" rel="next" aria-label={label("Next", next)}>
          {next.name} <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span className="pager-btn is-disabled" aria-disabled="true">
          Next <span aria-hidden="true">→</span>
        </span>
      )}
    </nav>
  );
}
