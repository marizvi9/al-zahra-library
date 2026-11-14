"use client";
// The home page's catalogue search: tabs to search everything, or only titles, authors or subjects
// (as library catalogues do), above the usual search bar with its live suggestions.
import { useState } from "react";
import SearchBox from "./SearchBox";
import type { SearchScope } from "@/lib/search";

const TABS: { value: SearchScope; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "category", label: "Subject" },
];

export default function CatalogSearch() {
  const [scope, setScope] = useState<SearchScope>("all");
  return (
    <div className="catalog-search">
      <div className="catalog-tabs" role="radiogroup" aria-label="Search in">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={scope === t.value}
            className={`catalog-tab ${scope === t.value ? "is-active" : ""}`}
            onClick={() => setScope(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <SearchBox large scope={scope} />
    </div>
  );
}
