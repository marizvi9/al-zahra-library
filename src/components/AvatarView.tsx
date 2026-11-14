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
        {padded && <img src={src} alt="" aria-hidden="true" width={size} height={size} loading="lazy" decoding="async" className="avatar-bg" style={blurFill(fg)} />}
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

/** The blurred fill: the same photo in the same place, enlarged from the badge's centre just enough to
 *  cover the badge, so its colours line up with the photo's edges. */
function blurFill(fg: React.CSSProperties): React.CSSProperties {
  const n = (v: unknown) => parseFloat(String(v));
  const l = n(fg.left), t = n(fg.top), w = n(fg.width), h = n(fg.height);
  const reach = (gap: number, have: number) => (have > 0.01 ? gap / have : 4);
  const k = 1.08 * Math.max(1, reach(50, 50 - l), reach(50, l + w - 50), reach(50, 50 - t), reach(50, t + h - 50));
  const L = 50 - (50 - l) * k, T = 50 - (50 - t) * k;
  return { position: "absolute", maxWidth: "none", objectFit: "fill", left: `${L.toFixed(2)}%`, top: `${T.toFixed(2)}%`, width: `${(w * k).toFixed(2)}%`, height: `${(h * k).toFixed(2)}%` };
}
