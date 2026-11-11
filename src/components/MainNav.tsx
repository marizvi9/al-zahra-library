"use client";
// The site's main tabs. Each is its own page; the gold underline marks where you are.

import Link from "next/link";
import { usePathname } from "next/navigation";

export const TABS = [
  { href: "/explore/", label: "Explore", also: ["/categories"] }, // old /categories/ links forward to /explore/
  { href: "/shelves/", label: "Shelves", also: [] },
  { href: "/authors/", label: "Authors", also: [] },
];

export default function MainNav() {
  const pathname = usePathname();
  const isCurrent = (t: (typeof TABS)[number]) => [t.href, ...t.also].some((p) => pathname.startsWith(p));
  return (
    <ul className="nav-list">
      {TABS.map((t) => (
        <li key={t.href}>
          <Link href={t.href} aria-current={isCurrent(t) ? "page" : undefined}>
            {t.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
