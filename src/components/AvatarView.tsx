// The round author badge itself: a photo framed on the head, or navy-and-gold initials.
// It takes everything it needs as props (no author data is loaded here), so the search box
// can use it too. Pages normally use <AuthorAvatar name=…/>, which looks the photo up.

import { circleLayout, type PhotoShape } from "@/lib/photoLayout";
import { withBase } from "@/lib/paths";

export type AvatarPhoto = PhotoShape & { src: string; title?: string };

type Props = { initials: string; photo?: AvatarPhoto | null; size?: number; className?: string };

export default function AvatarView({ initials, photo, size = 48, className = "" }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (photo) {
    const { fg, padded } = circleLayout(photo);
    const src = withBase(photo.src);
    return (
      <span className={`author-avatar ${className}`} style={style}>
        {/* Where the circle reaches past the photo's edge: a soft blurred copy fills the gap. */}
        {padded && <img src={src} alt="" aria-hidden="true" width={size} height={size} loading="lazy" decoding="async" className="avatar-bg" />}
        {/* The name is always shown next to the photo, so the image itself needs no alt text. */}
        <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" style={fg} title={photo.title} />
      </span>
    );
  }
  return (
    <span className={`author-avatar author-avatar-initials ${className}`} style={style} aria-hidden="true">
      {initials}
    </span>
  );
}
