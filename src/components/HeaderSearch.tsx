"use client";
// The search bar at the top of every page, except the home page (which has its own
// big one) and the search results page (which has its own search box).

import { usePathname } from "next/navigation";
import SearchBox from "./SearchBox";

export default function HeaderSearch() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/search")) return null;
  return (
    <div className="header-search">
      <div className="container">
        <SearchBox compact />
      </div>
    </div>
  );
}
