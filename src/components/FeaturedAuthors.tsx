// "Featured Authors" on the home page: large portraits in a row, each linking to the author's
// page, with the photo credit and licence underneath. Chosen in data/home-featured-sections.json.
// The name link is stretched over the whole card (see .card-link), so the small credit links
// can sit on top without links being nested.
import Link from "next/link";
import { badgeStyle, initials, isHolyFigure, photoFor } from "@/lib/authorPhotos";
import { withBase } from "@/lib/paths";
import { shortCreator } from "./AuthorAvatar";
import type { FeaturedAuthor } from "@/lib/homeSections";

export default function FeaturedAuthors({ heading, intro, authors }: { heading: string; intro: string; authors: FeaturedAuthor[] }) {
  return (
    <section className="container section" aria-labelledby="featured-authors-title">
      <div className="section-head">
        <div>
          <h2 id="featured-authors-title">{heading}</h2>
          {intro && <p className="section-lede">{intro}</p>}
        </div>
      </div>
      <ul className="portrait-row">
        {authors.map((a) => {
          const photo = isHolyFigure(a.name) ? null : photoFor(a.name);
          return (
            <li key={a.slug} className="portrait-card">
              <span className="portrait-frame">
                {photo ? (
                  <img
                    src={withBase(photo.photoLarge ?? photo.photo)}
                    alt=""
                    width={photo.largeWidth ?? 240}
                    height={photo.largeHeight ?? 300}
                    sizes="(max-width: 700px) 45vw, 210px"
                    loading="lazy"
                    decoding="async"
                    style={badgeStyle(photo, 1.4) /* face-centred; far-away shots zoomed a little, still sharp */}
                  />
                ) : (
                  <span className="portrait-initials" aria-hidden="true">
                    {initials(a.name)}
                  </span>
                )}
              </span>
              <Link href={`/authors/${a.slug}/`} className="portrait-name card-link" dir="auto">
                {/* Keep hyphenated words together ("al-Sadr") when the name wraps. */}
                {a.name.split(" ").map((w, i) => (
                  <span key={i}>
                    {i > 0 && " "}
                    {w.includes("-") ? <span className="nowrap">{w}</span> : w}
                  </span>
                ))}
              </Link>
              <span className="portrait-count">{a.count === 1 ? "1 book" : `${a.count} books`}</span>
              {photo && (
                <span className="portrait-credit">
                  Photo:{" "}
                  <a href={photo.source} rel="noopener">
                    {shortCreator(photo.creator)}
                  </a>
                  , {photo.licenseUrl ? <a href={photo.licenseUrl} rel="noopener license">{photo.license}</a> : photo.license}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
