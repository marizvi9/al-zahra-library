// The small, tidy "Sources" note shown only on a book's page and an author's page: where the description,
// cover, biography or photo came from, with links. Home page cards and sliders deliberately show no sources.

import type { ReactNode } from "react";

export type SourceItem = { label: string; content: ReactNode };

export default function SourcesNote({ items }: { items: SourceItem[] }) {
  if (items.length === 0) return null;
  return (
    <aside className="sources-note" aria-label="Sources">
      <h2 className="sources-title">Sources</h2>
      <ul>
        {items.map((it) => (
          <li key={it.label}>
            <span className="sources-label">{it.label}:</span> {it.content}
          </li>
        ))}
      </ul>
    </aside>
  );
}
