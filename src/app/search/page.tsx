import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import SearchClient from "./SearchClient";
import { books, categories, toListItem } from "@/lib/catalog";
import type { SearchRecord } from "@/lib/search";
import { authorRecords } from "@/lib/searchData";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  // A slimmed-down copy of each book, sent to the browser for instant search.
  const records: SearchRecord[] = books.map(toListItem);
  const categoryOptions = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <h1>Search the catalog</h1>
      <Suspense fallback={<p>Loading search…</p>}>
        <SearchClient records={records} authors={authorRecords()} categories={categoryOptions} />
      </Suspense>
    </div>
  );
}
