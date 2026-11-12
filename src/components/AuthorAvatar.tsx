// An author's photo (if there's a verified, freely licensed one) or, if not, a
// navy-and-gold badge with their initials. See src/lib/authorPhotos.ts.

import { initials, photoFor, viaSuffix, type AuthorPhoto } from "@/lib/authorPhotos";
import AvatarView from "./AvatarView";

type Props = { name: string | null | undefined; size?: number; className?: string };

export default function AuthorAvatar({ name, size = 48, className = "" }: Props) {
  const photo = photoFor(name);
  return (
    <AvatarView
      initials={initials(name ?? "")}
      size={size}
      className={className}
      photo={
        photo
          ? {
              src: photo.photo,
              focus: photo.focus,
              originalWidth: photo.originalWidth,
              originalHeight: photo.originalHeight,
              title: `Photo: ${shortCreator(photo.creator)}, ${photo.license}${viaSuffix(photo)}`,
            }
          : null
      }
    />
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
