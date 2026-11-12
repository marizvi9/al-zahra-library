// The row of sub-topic links at the top of a category. Each is a real link to its own
// page; the one you are on is highlighted (and marked for screen readers).
import Link from "next/link";
import type { Category } from "@/lib/catalog";

export default function SubTopicNav({ cat, current }: { cat: Category; current?: string }) {
  return (
    <nav aria-label={`Sub-topics in ${cat.name}`} className="subtopic-nav">
      <ul className="chip-list">
        <li>
          <Link href={`/explore/${cat.slug}/`} className={`chip ${current ? "" : "is-active"}`} aria-current={current ? undefined : "page"}>
            All books <span className="chip-count">{cat.count}</span>
          </Link>
        </li>
        {cat.subCategories.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/explore/${cat.slug}/${s.slug}/`}
              className={`chip ${s.slug === current ? "is-active" : ""}`}
              aria-current={s.slug === current ? "page" : undefined}
            >
              {s.number && cat.number && <span className="chip-no">{cat.number} · {s.number}</span>}
              {s.name} <span className="chip-count">{s.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
