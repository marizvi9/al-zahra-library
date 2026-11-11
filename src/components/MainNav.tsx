"use client";
// The site menu: "Explore" (all the categories) and a "More" dropdown.
//
// The dropdown is built on <details>, so it opens with a click, tap, Enter or Space
// even before JavaScript loads. With JavaScript it also closes when you pick a page,
// click elsewhere, or press Escape.

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MORE = [{ href: "/shelves/", label: "Shelves", hint: "Books by shelf number, as they stand in the library" }];

export default function MainNav() {
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

  const inExplore = pathname.startsWith("/explore");
  const inMore = MORE.some((i) => pathname.startsWith(i.href));

  return (
    <ul className="nav-list">
      <li>
        <Link href="/explore/" aria-current={inExplore ? "page" : undefined}>
          Explore
        </Link>
      </li>
      <li className="nav-dropdown">
        <details ref={ref} className="nav-menu">
          <summary className={inMore ? "is-current" : undefined}>
            More <span className="nav-menu-arrow" aria-hidden="true">▾</span>
          </summary>
          <ul className="nav-menu-list">
            {MORE.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={pathname.startsWith(i.href) ? "page" : undefined} onClick={close}>
                  <span className="nav-menu-label">{i.label}</span>
                  <span className="nav-menu-hint">{i.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </li>
    </ul>
  );
}
