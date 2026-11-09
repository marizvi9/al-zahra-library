"use client";
// The "Explore" dropdown in the site menu, with two choices:
//   - Explore by shelves   (/explore/)    shelf by shelf, with call numbers
//   - Browse by categories (/categories/) the simple list of subjects
// Built on <details>, so it opens with a click, tap, Enter or Space even before
// JavaScript loads. With JavaScript it also closes when you pick a page, click
// elsewhere, or press Escape.

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/explore/", label: "Explore by shelves", hint: "Shelf by shelf, with call numbers" },
  { href: "/categories/", label: "Browse by categories", hint: "A simple list of subjects" },
];

export default function ExploreMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const close = () => ref.current?.removeAttribute("open");

  useEffect(close, [pathname]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const inSection = ITEMS.some((i) => pathname.startsWith(i.href));

  return (
    <details ref={ref} className="nav-menu">
      <summary className={inSection ? "is-current" : undefined}>
        Explore <span className="nav-menu-arrow" aria-hidden="true">▾</span>
      </summary>
      <ul className="nav-menu-list">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={pathname.startsWith(i.href) ? "page" : undefined} onClick={close}>
              <span className="nav-menu-label">{i.label}</span>
              <span className="nav-menu-hint">{i.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
