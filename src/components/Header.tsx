"use client";
// The site header: a thin bar of practical links (address, hours, contact), then one tidy row —
// brand on the left, then the tabs, then a search bar.
//
// Wide screens: everything in one row.
// Tablets (under 1000px): the search bar folds into a magnifying-glass button that opens it.
// Phones (under 700px): the tabs fold into a "Menu" button too.
// Without JavaScript the tabs and search bar simply stay visible, so nothing is ever unreachable.
//
// The home page has no header search (its big search bar is right there in the welcome
// section), and neither does the search results page (it has its own box).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlowerMark } from "./Emblem";
import MainNav from "./MainNav";
import SearchBox from "./SearchBox";
import Girih from "./Girih";
import { AddressLink } from "./LibraryLinks";

export default function Header() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const showSearch = pathname !== "/" && !pathname.startsWith("/search");

  useEffect(() => setReady(true), []);
  // Fold everything away again after moving to another page.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (searchOpen) searchRef.current?.querySelector("input")?.focus();
  }, [searchOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      // Escape inside the search bar first closes its suggestions; a second press folds it.
      if (!document.querySelector(".header-search [aria-expanded='true']")) setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="site-header">
      {/* The same star pattern as the footer, behind the bar. */}
      <div className="header-pattern" aria-hidden="true">
        <Girih className="girih-footer" />
      </div>
      {/* A thin bar of practical links on top, as library websites have (hidden on phones; the menu has them). */}
      <div className="header-utility">
        <div className="container header-utility-inner">
          <span className="header-utility-address">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <AddressLink />
          </span>
          <span className="header-utility-links">
            <Link href="/visit/">Hours &amp; location</Link>
            <Link href="/faq/">FAQ</Link>
            <Link href="/contact/">Contact</Link>
          </span>
        </div>
      </div>
      <div
        className="container header-inner"
        data-ready={ready || undefined}
        data-menu-open={menuOpen || undefined}
        data-search-open={searchOpen || undefined}
      >
        <Link href="/" className="brand">
          {/* The gold flower from the emblem (src/components/Emblem.tsx). */}
          <FlowerMark className="brand-logo" />
          <span className="brand-name">
            Al-Zahra <span className="brand-name-rest">Islamic Library</span>
          </span>
        </Link>

        <nav aria-label="Main" id="main-nav" className="main-nav">
          <MainNav />
        </nav>

        {showSearch && (
          <div className="header-search" id="header-search" ref={searchRef} role="search">
            <SearchBox compact />
          </div>
        )}

        <div className="header-buttons">
          {showSearch && (
            <button
              type="button"
              className="header-btn header-btn-search"
              aria-expanded={searchOpen}
              aria-controls="header-search"
              onClick={() => {
                setSearchOpen((o) => !o);
                setMenuOpen(false);
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                {searchOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                ) : (
                  <>
                    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </>
                )}
              </svg>
              <span className="visually-hidden">{searchOpen ? "Close search" : "Search"}</span>
            </button>
          )}
          <button
            type="button"
            className="header-btn header-btn-menu"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => {
              setMenuOpen((o) => !o);
              setSearchOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              )}
            </svg>
            <span className="header-btn-label">Menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}
