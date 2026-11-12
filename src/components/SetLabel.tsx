// The small "Part of a multi-volume set" label, linking to the set's page.
// (Inside cards it sits above the card's stretched link, like author names do.)
import Link from "next/link";
import type { SetRef } from "@/lib/setIndex";

export default function SetLabel({ set }: { set: SetRef }) {
  const series = set.kind === "series";
  return (
    <Link href={`/sets/${set.slug}/`} className="set-label" title={`${set.name}: ${set.volume}`}>
      <span className="set-label-icon" aria-hidden="true">▤</span>
      {series ? "Part of a series" : "Part of a multi-volume set"} · {set.volume}
    </Link>
  );
}
