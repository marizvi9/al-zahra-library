// Home page: three multi-volume sets shown big, in the same "featured" style as the rest of the page.
// Which sets: "homeFeatured" in data/multi-volume-sets.json. Each card shows the set's volumes side by side
// (overlapping a little, in order) with large covers, the set name, author, which volumes the library holds, and a link.
import Link from "next/link";
import ArchCover from "./ArchCover";
import { getCover } from "@/lib/catalog";
import { withBase } from "@/lib/paths";
import type { VolumeSet } from "@/lib/sets";

export default function FeaturedSets({ sets, total }: { sets: VolumeSet[]; total: number }) {
  return (
    <section className="container section featured-sets" aria-labelledby="sets-title">
      <div className="section-head">
        <h2 id="sets-title">Featured multi-volume sets</h2>
        <Link href="/sets/" className="see-all">
          All {total} sets
        </Link>
      </div>
      <p className="section-lede">Works the library holds in several volumes. Open one to see every volume in order and where to find it on the shelf.</p>
      <ul className="featured-sets-grid">
        {sets.map((s) => (
          <li key={s.slug} className="featured-set">
            <Link href={`/sets/${s.slug}/`} className="featured-set-covers" aria-label={`${s.name}: see all ${s.volumes.length} volumes`}>
              {s.volumes.slice(0, 3).map((v) => {
                const b = v.books.find((x) => getCover(x.id)?.images[0]) ?? v.books[0];
                const img = getCover(b.id)?.images[0];
                return (
                  <span key={v.label} className="featured-set-cover">
                    {img ? (
                      <img src={withBase(img.large ?? img.src)} alt="" width={img.width} height={img.height} loading="lazy" decoding="async" />
                    ) : (
                      <ArchCover title={b.title} author={b.author} seed={s.slug} />
                    )}
                  </span>
                );
              })}
            </Link>
            <div className="featured-set-text">
              <p className="eyebrow">{s.volumes.length} {s.kind === "series" ? "issues" : "volumes"} in the library</p>
              <h3 className="featured-set-title" dir="auto">
                <Link href={`/sets/${s.slug}/`}>{s.name}</Link>
              </h3>
              {s.author && <p className="featured-set-author" dir="auto">{s.author}</p>}
              <p className="featured-set-vols">{s.volumes.map((v) => v.label).join(" · ")}</p>
              {s.missing && <p className="small muted">Not in the catalogue: {s.missing}</p>}
              <Link href={`/sets/${s.slug}/`} className="featured-set-more">
                See the set →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
