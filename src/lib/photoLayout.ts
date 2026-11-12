// How an author photo is framed: pure maths, no data. (Kept apart from authorPhotos.ts, which loads
// data/authors.json, so the search box can use it without downloading all of that data.)

export type Focus = { x: number; y: number; zoom?: number };
export type PhotoShape = { focus?: Focus; originalWidth?: number | null; originalHeight?: number | null };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Round badge: draws the photo so the head's centre sits in the middle of the circle, at the stored zoom.
 * When the circle reaches past the photo's edge ("padded"), the edge fades softly into a blurred copy of
 * the same photo instead of showing a hard border. All numbers are percentages of the badge.
 */
export function circleLayout(p: PhotoShape): {
  fg: React.CSSProperties;
  padded: boolean;
} {
  const f = p.focus ?? { x: 50, y: 35, zoom: 1 };
  const W = p.originalWidth ?? 1;
  const H = p.originalHeight ?? 1;
  const side = Math.min(W, H) / (f.zoom ?? 1); // the square of the photo that fills the badge
  const cx = (f.x / 100) * W;
  const cy = (f.y / 100) * H;
  const padX = side > W + 0.5;
  const padY = side > H + 0.5;
  const left = padX ? cx - side / 2 : clamp(cx - side / 2, 0, W - side);
  const top = padY ? cy - side / 2 : clamp(cy - side / 2, 0, H - side);
  const fg: React.CSSProperties = {
    position: "absolute",
    maxWidth: "none",
    objectFit: "fill",
    left: `${((-left / side) * 100).toFixed(2)}%`,
    top: `${((-top / side) * 100).toFixed(2)}%`,
    width: `${((W / side) * 100).toFixed(2)}%`,
    height: `${((H / side) * 100).toFixed(2)}%`,
  };
  if (padX || padY) {
    const fade = (dir: string) => `linear-gradient(${dir}, transparent 0, #000 16%, #000 84%, transparent 100%)`;
    const layers = [padX && fade("to right"), padY && fade("to bottom")].filter(Boolean).join(", ");
    Object.assign(fg, {
      WebkitMaskImage: layers,
      maskImage: layers,
      WebkitMaskComposite: "source-in",
      maskComposite: "intersect",
    });
  }
  return { fg, padded: padX || padY };
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

