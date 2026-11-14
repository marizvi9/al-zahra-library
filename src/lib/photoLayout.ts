// How an author photo is framed: pure maths, no data. (Kept apart from authorPhotos.ts, which loads
// data/authors.json, so the search box can use it without downloading all of that data.)

export type Focus = { x: number; y: number; zoom?: number };
export type PhotoShape = { focus?: Focus; originalWidth?: number | null; originalHeight?: number | null };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** How much of the photo's edge fades into the blurred fill, where the frame reaches past that edge:
 *  narrow at the sides, thinner still at the top (near the head), wider at the bottom (only the chest). */
export const FADE = { side: 0.08, top: 0.05, bottom: 0.16 };
/** At most this much of the frame may be blurred fill above the photo's top edge. */
const MAX_TOP_GAP = 0.1;

export type CircleFades = { left: boolean; right: boolean; top: boolean; bottom: boolean };

/**
 * Round badge: draws the photo so the head's centre sits in the middle of the circle, at the stored zoom.
 * When the circle reaches past the photo's edge ("padded"), that edge fades softly into a blurred copy of
 * the same photo. Heads and turbans are usually near the photo's top and must never be blurred, so at most
 * a sliver of space is left above the photo (enough for the circle's curve to clear the head) and any other
 * extra height goes below. Only the edges with a gap fade. All numbers are percentages of the badge.
 */
export function circleLayout(p: PhotoShape): {
  fg: React.CSSProperties;
  padded: boolean;
  fades: CircleFades;
} {
  const f = p.focus ?? { x: 50, y: 35, zoom: 1 };
  const W = p.originalWidth ?? 1;
  const H = p.originalHeight ?? 1;
  const side = Math.min(W, H) / (f.zoom ?? 1); // the square of the photo that fills the badge
  const cx = (f.x / 100) * W;
  const cy = (f.y / 100) * H;
  const left = side > W + 0.5 ? cx - side / 2 : clamp(cx - side / 2, 0, W - side);
  const top = side > H + 0.5 ? clamp(cy - side / 2, Math.max(H - side, -MAX_TOP_GAP * side), 0) : clamp(cy - side / 2, 0, H - side);
  const fades: CircleFades = { left: left < -0.5, right: left + side > W + 0.5, top: top < -0.5, bottom: top + side > H + 0.5 };
  const padded = fades.left || fades.right || fades.top || fades.bottom;
  const fg: React.CSSProperties = {
    position: "absolute",
    maxWidth: "none",
    objectFit: "fill",
    left: `${((-left / side) * 100).toFixed(2)}%`,
    top: `${((-top / side) * 100).toFixed(2)}%`,
    width: `${((W / side) * 100).toFixed(2)}%`,
    height: `${((H / side) * 100).toFixed(2)}%`,
  };
  if (padded) {
    const sd = FADE.side * 100, tp = FADE.top * 100, bt = FADE.bottom * 100;
    const layers = [
      (fades.left || fades.right) &&
        `linear-gradient(to right, ${fades.left ? `transparent 0, #000 ${sd}%` : "#000 0"}, ${fades.right ? `#000 ${100 - sd}%, transparent 100%` : "#000 100%"})`,
      (fades.top || fades.bottom) &&
        `linear-gradient(to bottom, ${fades.top ? `transparent 0, #000 ${tp}%` : "#000 0"}, ${fades.bottom ? `#000 ${100 - bt}%, transparent 100%` : "#000 100%"})`,
    ]
      .filter(Boolean)
      .join(", ");
    Object.assign(fg, {
      WebkitMaskImage: layers,
      maskImage: layers,
      WebkitMaskComposite: "source-in",
      maskComposite: "intersect",
    });
  }
  return { fg, padded, fades };
}

/**
 * Rectangular frame (the arch on the home page): object-position that puts the head's centre in the middle of the
 * frame where the photo's shape allows it, and a modest zoom for far-away shots.
 */
export function frameStyle(
  p: PhotoShape,
  frameAspect: number,
  maxZoom = 1.7,
): React.CSSProperties {
  const f = p.focus ?? { x: 50, y: 35, zoom: 1 };
  const ia = (p.originalWidth ?? 4) / (p.originalHeight ?? 5);
  const cx = f.x / 100;
  const cy = f.y / 100;
  let px = 50;
  let py = 50;
  if (ia > frameAspect + 0.001) px = clamp(((cx * ia - frameAspect / 2) / (ia - frameAspect)) * 100, 0, 100);
  else if (ia < frameAspect - 0.001) py = clamp(((cy / ia - 1 / (2 * frameAspect)) / (1 / ia - 1 / frameAspect)) * 100, 0, 100);
  const z = clamp(f.zoom ?? 1, 1, maxZoom);
  return { objectPosition: `${px.toFixed(1)}% ${py.toFixed(1)}%`, ...(z > 1.02 ? { scale: z.toFixed(2), transformOrigin: "50% 50%" } : {}) };
}

