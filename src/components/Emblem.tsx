// The Al-Zahra Islamic Library emblem, redrawn as SVG from public/brand/emblem.png
// so it stays crisp at any size and its parts can be animated in the opening intro.
//
//   <FlowerMark />  just the gold flower (header, small places)
//   <Emblem />      the full emblem: arc lettering, flower, stars, AL-ZAHRA, IEC-HOUSTON
//
// The flower is traced from the original artwork (stroke centre-lines). The lettering
// uses Montserrat, which is close to the emblem's typeface.

const GOLD = "#ac8521";
const NAVY = "#04142e";

/** Flower paths, in a 566 × 430 box. Each path is one stroke of the original. */
export const FLOWER_PATHS = {
  ground: "M142 420 Q283 345 424 420",
  stem: "M283 218 V380",
  wingL: "M10 128 L77 286 C150 268 232 306 278 378",
  wingR: "M556 128 L489 286 C416 268 334 306 288 378",
  leafL: "M10 128 C95 104 205 118 283 218",
  leafR: "M556 128 C471 104 361 118 283 218",
  petalL: "M122 121 C119 92 127 62 142 40 C181 42 211 55 230 73",
  petalR: "M444 121 C447 92 439 62 424 40 C385 42 355 55 336 73",
  bud: "M283 15 C232 68 196 140 205 202 C212 256 250 296 283 320 C316 296 354 256 361 202 C370 140 334 68 283 15 Z",
};

function FlowerStrokes({ className = "" }: { className?: string }) {
  return (
    <g className={className} fill="none" stroke={GOLD} strokeWidth="14" strokeLinejoin="miter" strokeLinecap="butt">
      {Object.entries(FLOWER_PATHS).map(([name, d]) => (
        <path key={name} d={d} pathLength={1} className={`fl-${name}`} />
      ))}
    </g>
  );
}

export function FlowerMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      viewBox="-8 0 582 432"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <FlowerStrokes />
    </svg>
  );
}

/** A 16-point star like the emblem's four small stars. */
function starPoints(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 32; i++) {
    const rad = i % 2 === 0 ? r : r * 0.36;
    const a = (Math.PI * i) / 16 - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** The letters of ISLAMIC LIBRARY and their angle around the arc (centre 705,720). */
const ARC_LETTERS: [string, number][] = [["I", -61.2], ["S", -54.5], ["L", -46.1], ["A", -36.7], ["M", -26.1], ["I", -17.4], ["C", -8.5], ["L", 7.1], ["I", 12.8], ["B", 20.7], ["R", 29.8], ["A", 39.1], ["R", 48.4], ["Y", 59.5]];

const STARS = [
  [202, 594],
  [202, 726],
  [1205, 594],
  [1205, 726],
];

/**
 * The full emblem. Pass `animated` in the intro: parts get class names the CSS uses
 * to play the bloom (flower), twinkle (stars) and letters settling into place.
 */
export function Emblem({ className = "", animated = false, title = "Al-Zahra Islamic Library, IEC-Houston" }: { className?: string; animated?: boolean; title?: string }) {
  return (
    <svg className={`emblem ${animated ? "emblem-animated" : ""} ${className}`} viewBox="140 50 1130 1060" role="img" aria-label={title}>
      <g className="em-arc">
        {/* Each letter is placed and turned separately (angles measured from the original),
            which looks the same in every browser. */}
        {ARC_LETTERS.map(([ch, deg], i) => (
          <text
            key={i}
            x="705"
            y="166"
            textAnchor="middle"
            transform={`rotate(${deg} 705 720)`}
            fill={NAVY}
            fontFamily="var(--font-brand), Montserrat, sans-serif"
            fontWeight="500"
            fontSize="98"
            className="em-letter"
            style={{ ["--i" as string]: i }}
          >
            {ch}
          </text>
        ))}
      </g>
      <g className="em-stars" fill={GOLD}>
        {STARS.map(([x, y], i) => (
          <polygon key={i} points={starPoints(x, y, 40)} className={`em-star em-star-${i}`} style={{ transformOrigin: `${x}px ${y}px` }} />
        ))}
      </g>
      <g className="em-flower" transform="translate(420 330)">
        <FlowerStrokes />
      </g>
      <g className="em-name">
        <text x="705" y="962" textAnchor="middle" fill={NAVY} fontFamily="var(--font-brand), Montserrat, sans-serif" fontWeight="600" fontSize="172" textLength="980" lengthAdjust="spacingAndGlyphs">
          AL-ZAHRA
        </text>
      </g>
      <g className="em-place">
        <text x="705" y="1076" textAnchor="middle" fill={GOLD} fontFamily="var(--font-brand), Montserrat, sans-serif" fontWeight="500" fontSize="62" letterSpacing="9">
          IEC-HOUSTON
        </text>
      </g>
    </svg>
  );
}
