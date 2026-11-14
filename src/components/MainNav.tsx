"use client";
// The site's main tabs: Explore, Authors, and a "More" drop-down that holds Shelves, Multi-Volume Sets, FAQ and Contact Us.
// The gold underline marks where you are (on "More" too, when you are on a page inside it).
//
// The drop-down is a native <details>, so it opens and closes even without JavaScript. The code
// below only adds the extras: it folds away on Escape, on a click elsewhere, and after a page change.

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; also: string[] };

export const TABS: Tab[] = [
  { href: "/explore/", label: "Explore", also: ["/categories"] }, // old /categories/ links forward to /explore/
  { href: "/authors/", label: "Authors", also: [] },
];
// Tucked away under "More".
export const MORE: Tab[] = [
  { href: "/shelves/", label: "Shelves", also: [] },
  { href: "/sets/", label: "Multi-Volume Sets", also: [] },
  { href: "/faq/", label: "FAQ", also: [] },
  { href: "/contact/", label: "Contact Us", also: [] },
];

export default function MainNav() {
  const pathname = usePathname();
  const moreRef = useRef<HTMLDetailsElement>(null);
  const isCurrent = (t: Tab) => [t.href, ...t.also].some((p) => pathname.startsWith(p));
  const moreCurrent = MORE.some(isCurrent);

  // Fold the drop-down away after moving to another page.
  useEffect(() => {
    if (moreRef.current) moreRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const el = moreRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && el.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (el.open && !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <ul className="nav-list">
      {TABS.map((t) => (
        <li key={t.href}>
          <Link href={t.href} aria-current={isCurrent(t) ? "page" : undefined}>
            {t.label}
          </Link>
        </li>
      ))}
      <li className="nav-more">
        <details ref={moreRef} className="nav-more-details">
          <summary className="nav-more-summary" data-current={moreCurrent || undefined}>
            More
            <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" className="nav-more-caret">
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ul className="nav-more-list">
            {MORE.map((t) => (
              <li key={t.href}>
                <Link href={t.href} aria-current={isCurrent(t) ? "page" : undefined}>
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </li>
    </ul>
  );
}
