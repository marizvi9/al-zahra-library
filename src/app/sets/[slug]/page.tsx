import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ArchCover from "@/components/ArchCover";
import Credit from "@/components/Credit";
import { creditParts, getCover } from "@/lib/catalog";
import { getSet, volumeSets } from "@/lib/sets";
import { withBase } from "@/lib/paths";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return volumeSets.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getSet((await params).slug);
  return s ? { title: s.name, description: `${s.name}: ${s.volumes.map((v) => v.label).join(", ")} in the Al-Zahra Islamic Library.` } : {};
}

export default async function SetPage({ params }: Props) {
  const set = getSet((await params).slug);
  if (!set) notFound();
  const series = set.kind === "series";
  const heldText = series
    ? `${set.volumes.length} issues in the library`
    : `${set.volumes.length} ${set.volumes.length === 1 ? "volume" : "volumes"} in the library${set.totalVolumes ? ` (of ${set.totalVolumes})` : ""}`;

  return (
    <div className="container page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Multi-Volume Sets", href: "/sets/" }, { label: set.name }]}
      />
      <header className="set-head">
        <p className="eyebrow">{series ? "Series of issues" : "Multi-volume set"}</p>
        <h1 dir="auto">{set.name}</h1>
        {set.author && <p className="set-head-author" dir="auto">by {set.author}</p>}
        <p className="set-head-count">{heldText}</p>
        {set.description && <p className="set-head-desc">{set.description}</p>}
        {set.missing && (
          <p className="set-gap" role="note">
            <strong>Not in the catalogue:</strong> {set.missing}. {series ? "" : "Ask at the library desk if you need it."}
          </p>
        )}
      </header>

      <ol className="set-volumes-grid">
        {set.volumes.map((v) => (
          <li key={v.label} className="set-volume">
            <h2 className="set-volume-label">{v.label}</h2>
            {v.books.map((b, i) => {
              const cover = getCover(b.id)?.images[0];
              return (
                <div key={b.id} className="set-volume-book">
                  <Link href={`/books/${b.slug}/`} className="set-volume-cover" aria-label={`${b.title}, ${v.label}`}>
                    {cover ? (
                      <img
                        src={withBase(cover.src)}
                        alt=""
                        width={cover.width}
                        height={cover.height}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    ) : (
                      <ArchCover title={b.title} author={b.author} seed={set.slug} />
                    )}
                  </Link>
                  <div className="set-volume-text">
                    <Link href={`/books/${b.slug}/`} className="set-volume-title" dir="auto">
                      {b.title}
                    </Link>
                    <span className="set-volume-author" dir="auto">
                      {b.author ? <Credit parts={creditParts(b)} /> : "Unknown"}
                    </span>
                    <span className="set-volume-shelf">
                      {b.callNumber ? (
                        <>
                          <span className="visually-hidden">Shelf </span>
                          <span className="call-badge">{b.callNumber}</span>
                        </>
                      ) : (
                        <span className="small muted">No call number yet. Please ask at the desk.</span>
                      )}
                      {v.books.length > 1 && <span className="small muted"> · listed {v.books.length} times (copies)</span>}
                      {!b.available && <span className="status-text"> · Not available</span>}
                    </span>
                  </div>
                </div>
              );
            })}
            {v.note && <p className="small muted">{v.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
