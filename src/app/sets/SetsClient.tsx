"use client";
// The Multi-Volume Sets page: every set as a large card, with a box that filters by name (or author, or a volume's title).

import { useMemo, useState } from "react";
import Link from "next/link";
import ArchCover from "@/components/ArchCover";
import { normalize } from "@/lib/search";
import { withBase } from "@/lib/paths";

export type SetCard = {
  slug: string;
  name: string;
  kind: string;
  author: string | null;
  held: number;
  volumes: string[];
  missing: string | null;
  cover: { src: string; width: number; height: number } | null;
  titles: string[];
};

export default function SetsClient({ sets }: { sets: SetCard[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const words = normalize(q).split(" ").filter(Boolean);
    if (!words.length) return sets;
    return sets.filter((s) => {
      const hay = normalize(`${s.name} ${s.author ?? ""} ${s.titles.join(" ")}`);
      return words.every((w) => hay.includes(w));
    });
  }, [q, sets]);

  return (
    <>
      <form role="search" className="search-box search-box-large" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="set-filter" className="visually-hidden">
          Filter the sets by name
        </label>
        <input id="set-filter" type="search" dir="auto" placeholder="Search the sets by name" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <p className="result-count" role="status" aria-live="polite">
        {q.trim() ? (shown.length ? `${shown.length} of ${sets.length} sets` : `No sets match “${q.trim()}”.`) : `${sets.length} sets`}
      </p>
      <ul className="set-cards">
        {shown.map((s) => (
          <li key={s.slug} className="set-card">
            <span className="set-card-cover">
              {s.cover ? (
                <img src={withBase(s.cover.src)} alt="" width={s.cover.width} height={s.cover.height} loading="lazy" decoding="async" />
              ) : (
                <ArchCover title={s.name} author={s.author} seed={s.slug} />
              )}
              <span className="set-card-count">{s.kind === "series" ? `${s.held} issues` : `${s.held} ${s.held === 1 ? "volume" : "volumes"}`}</span>
            </span>
            <span className="set-card-text">
              <Link href={`/sets/${s.slug}/`} className="set-card-title card-link" dir="auto">
                {s.name}
              </Link>
              {s.author && <span className="set-card-author" dir="auto">{s.author}</span>}
              <span className="set-card-vols">{s.volumes.join(" · ")}</span>
              {s.missing && <span className="small muted">Not in the catalogue: {s.missing}</span>}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
