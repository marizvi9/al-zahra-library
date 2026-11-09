"use client";
// The row of tabs at the top of the Explore page: "All shelves", then one tab per
// shelf in number order, each labelled with its number AND subject (e.g. 300 · Fiqh),
// because every numbered shelf holds exactly one subject.
// Each tab is a real link (/explore/, /explore/300/ …), so a shelf can be bookmarked or
// shared. On phones the row scrolls sideways and the current tab is scrolled into view.

import { useEffect, useRef } from "react";
import Link from "next/link";

type Tab = { slug: string; label: string; categories: string[]; count: number };
type Props = { shelves: Tab[]; active: string };

export default function ShelfTabs({ shelves, active }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const tab = ref.current;
    const row = tab?.closest(".shelf-tabs");
    if (tab && row) row.scrollLeft = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
  }, [active]);

  const total = shelves.reduce((n, s) => n + s.count, 0);
  const tabs = [
    { slug: "", label: "All shelves", subject: "Everything", count: total },
    ...shelves.map((s) => ({
      slug: s.slug,
      label: s.label,
      subject: s.slug === "none" ? `${s.categories.length} subjects` : s.categories.join(", "),
      count: s.count,
    })),
  ];

  return (
    <nav className="shelf-tabs" aria-label="Shelves">
      <ul>
        {tabs.map((t) => {
          const isActive = t.slug === active;
          return (
            <li key={t.slug || "all"}>
              <Link
                href={t.slug ? `/explore/${t.slug}/` : "/explore/"}
                ref={isActive ? ref : undefined}
                className={`shelf-tab ${t.slug ? "" : "shelf-tab-all"} ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="shelf-tab-no">{t.label}</span>
                <span className="shelf-tab-name">{t.subject}</span>
                <span className="shelf-tab-count">
                  {t.count}
                  <span className="visually-hidden"> books</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
