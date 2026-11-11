// The big portrait at the top of an author's own page: the large photo (with its credit),
// or, if there's no verified photo, a large navy-and-gold initials panel.
// The photo is never stretched beyond the size of the copy we have, so it stays sharp.

import { initials, photoFor } from "@/lib/authorPhotos";
import { withBase } from "@/lib/paths";
import { PhotoCredit } from "./AuthorAvatar";

export default function AuthorPortrait({ name }: { name: string }) {
  const photo = photoFor(name);
  if (photo) {
    const src = photo.photoLarge ?? photo.photo;
    const w = photo.largeWidth ?? 240;
    const h = photo.largeHeight ?? 300;
    return (
      <figure className="author-portrait" style={{ ["--native-w" as string]: `${w}px` }}>
        {/* The author's name is the page heading right beside this, so no alt text is needed. */}
        <img src={withBase(src)} alt="" width={w} height={h} fetchPriority="high" decoding="async" />
        <figcaption>
          <PhotoCredit photo={photo} />
        </figcaption>
      </figure>
    );
  }
  return (
    <div className="author-portrait author-portrait-initials" aria-hidden="true">
      <span>{initials(name)}</span>
    </div>
  );
}
