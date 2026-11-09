"use client";
// A row of tabs, one per shelf number. Each tab is a real link (/shelves/100/ …),
// so every shelf can be bookmarked or shared. On phones the row scrolls sideways
// and the current tab is scrolled into view.

import { useEffect, useRef } from "react";
import Link from "next/link";

type Props = { shelves: { slug: string; label: string; count: number }[]; active?: string };

export default function ShelfTabs({ shelves, active }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  return (
    <nav className="shelf-tabs" aria-label="Shelves">
      <ul>
        {shelves.map((s) => {
          const isActive = s.slug === active;
          return (
            <li key={s.slug}>
              <Link
                href={`/shelves/${s.slug}/`}
                ref={isActive ? ref : undefined}
                className={`shelf-tab ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="shelf-tab-no">{s.label}</span>
                <span className="shelf-tab-count">{s.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
