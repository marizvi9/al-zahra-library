// An author's photo (if there's a verified, freely licensed one) or, if not, a
// navy-and-gold badge with their initials. See src/lib/authorPhotos.ts.

import { circleLayout, initials, photoFor, viaSuffix, type AuthorPhoto } from "@/lib/authorPhotos";
import { withBase } from "@/lib/paths";

type Props = { name: string | null | undefined; size?: number; className?: string };

export default function AuthorAvatar({ name, size = 48, className = "" }: Props) {
  const photo = photoFor(name);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (photo) {
    const { fg, padded } = circleLayout(photo);
    const src = withBase(photo.photo);
    return (
      <span className={`author-avatar ${className}`} style={style}>
        {/* Where the circle reaches past the photo's edge: a soft blurred copy fills the gap. */}
        {padded && <img src={src} alt="" aria-hidden="true" width={size} height={size} loading="lazy" decoding="async" className="avatar-bg" />}
        {/* The name is always shown next to the photo, so the image itself needs no alt text. */}
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          style={fg}
          title={`Photo: ${shortCreator(photo.creator)}, ${photo.license}${viaSuffix(photo)}`}
        />
      </span>
    );
  }
  return (
    <span className={`author-avatar author-avatar-initials ${className}`} style={style} aria-hidden="true">
      {initials(name ?? "")}
    </span>
  );
}

export const shortCreator = (c: string) => (c.length > 60 ? c.slice(0, 57).trimEnd() + "…" : c);

/** "Photo: Name, CC BY-SA 4.0, via Wikimedia Commons" (or WikiShia), each part linked. */
export function PhotoCredit({ photo }: { photo: AuthorPhoto }) {
  return (
    <p className="photo-credit">
      Photo:{" "}
      <a href={photo.source} rel="noopener">
        {shortCreator(photo.creator)}
      </a>
      ,{" "}
      {photo.licenseUrl ? (
        <a href={photo.licenseUrl} rel="noopener license">
          {photo.license}
        </a>
      ) : (
        photo.license
      )}
      {viaSuffix(photo)}
    </p>
  );
}
