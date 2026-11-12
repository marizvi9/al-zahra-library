import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import SetsClient, { type SetCard } from "./SetsClient";
import { getCover } from "@/lib/catalog";
import { volumeSets } from "@/lib/sets";

export const metadata: Metadata = {
  title: "Multi-Volume Sets",
  description: "Works the Al-Zahra Islamic Library holds in several volumes or parts, with the volumes in order.",
};

export default function SetsPage() {
  const cards: SetCard[] = volumeSets.map((s) => {
    const cover = s.coverBook ? getCover(s.coverBook.id)?.images[0] : undefined;
    return {
      slug: s.slug,
      name: s.name,
      kind: s.kind,
      author: s.author,
      held: s.volumes.length,
      volumes: s.volumes.map((v) => v.label),
      missing: s.missing,
      cover: cover ? { src: cover.src, width: cover.width, height: cover.height } : null,
      titles: s.volumes.flatMap((v) => v.books.map((b) => b.title)),
    };
  });
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Multi-Volume Sets" }]} />
      <h1>Multi-Volume Sets</h1>
      <p className="lede">
        Works that come in several volumes or parts. Each set is listed once; open it to see every volume the library holds, in order,
        and where to find it on the shelf.
      </p>
      <SetsClient sets={cards} />
    </div>
  );
}
