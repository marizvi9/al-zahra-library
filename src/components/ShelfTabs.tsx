"use client";
// The row of tabs at the top of the Browse page: "All shelves", then one tab per
// shelf number in order. Each tab is a real link (/browse/, /browse/100/ …), so
// every shelf can be bookmarked or shared. On phones the row scrolls sideways
// and the current tab is scrolled into view.

import { useEffect, useRef } from "react";
import Link from "next/link";

type Props = { shelves: { slug: string; label: string; count: number }[]; active: string };

export default function ShelfTabs({ shelves, active }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const tab = ref.current;
    const row = tab?.closest(".shelf-tabs");
    if (tab && row) row.scrollLeft = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
  }, [active]);

  const total = shelves.reduce((n, s) => n + s.count, 0);
  const tabs = [{ slug: "", label: "All shelves", count: total }, ...shelves];

  return (
    <nav className="shelf-tabs" aria-label="Shelves">
      <ul>
        {tabs.map((s) => {
          const isActive = s.slug === active;
          return (
            <li key={s.slug || "all"}>
              <Link
                href={s.slug ? `/browse/${s.slug}/` : "/browse/"}
                ref={isActive ? ref : undefined}
                className={`shelf-tab ${s.slug ? "" : "shelf-tab-all"} ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="shelf-tab-no">{s.label}</span>
                <span className="shelf-tab-count">
                  {s.count}
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
