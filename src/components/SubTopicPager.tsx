// "← Previous sub-topic" and "Next sub-topic →" at the bottom of a sub-topic page.
// First sub-topic: Previous is shown greyed out (not a link). Last sub-topic: Next becomes a
// link to the next category, when there is one.
import Link from "next/link";
import type { Category, SubCategory } from "@/lib/catalog";

type Props = {
  cat: Category;
  prev: SubCategory | null;
  next: SubCategory | null;
  nextCategory: Category | null;
};

export default function SubTopicPager({ cat, prev, next, nextCategory }: Props) {
  return (
    <nav className="pager" aria-label="Previous and next sub-topic">
      {prev ? (
        <Link href={`/explore/${cat.slug}/${prev.slug}/`} className="pager-link pager-prev" rel="prev">
          <span className="pager-dir">← Previous</span>
          <span className="pager-name">{prev.name}</span>
        </Link>
      ) : (
        <span className="pager-link pager-prev is-disabled" aria-disabled="true">
          <span className="pager-dir">← Previous</span>
          <span className="pager-name">This is the first</span>
        </span>
      )}
      {next ? (
        <Link href={`/explore/${cat.slug}/${next.slug}/`} className="pager-link pager-next" rel="next">
          <span className="pager-dir">Next →</span>
          <span className="pager-name">{next.name}</span>
        </Link>
      ) : nextCategory ? (
        <Link href={`/explore/${nextCategory.slug}/`} className="pager-link pager-next">
          <span className="pager-dir">Next category →</span>
          <span className="pager-name">{nextCategory.name}</span>
        </Link>
      ) : (
        <span className="pager-link pager-next is-disabled" aria-disabled="true">
          <span className="pager-dir">Next →</span>
          <span className="pager-name">This is the last</span>
        </span>
      )}
    </nav>
  );
}
