// The footer's horizontal logo, drawn as SVG with a transparent background (sharp at any size).
// The lettering is the emblem's OWN lettering: AL-ZAHRA, ISLAMIC LIBRARY and IEC-HOUSTON were
// cut out of public/brand/emblem.png and traced to vector outlines (scripts/trace_lettering.mjs →
// lettering.ts). ISLAMIC LIBRARY keeps its letter shapes and spacing but is laid in a straight line.
// The flower and stars are the emblem's too (Emblem.tsx). The footer is dark navy, so the emblem's
// navy letters are drawn in parchment white here; gold stays gold.
import { FLOWER_PATHS, starPoints } from "./Emblem";
import { HOUSTON, LIBRARY, ZAHRA } from "./lettering";

const GOLD = "#d4af55"; // the emblem's gold, lightened a little so it glows on navy
const LETTERS = "#f7f1e1"; // where the emblem uses navy

// Everything below is in the lettering's units (the emblem's pixels × 4).
const FLOWER_W = 560 * 4;
const GAP = 380; // flower ↔ words
const BLOCK_X = FLOWER_W + GAP;
const BLOCK_W = ZAHRA.maxx - ZAHRA.minx; // the words are as wide as AL-ZAHRA
const MID = BLOCK_X + BLOCK_W / 2; // the middle of the words: the stars sit here too

const STAR_R = 90; // small
const STAR_GAP = 40; // space between the two stars
const GAP_STAR = 130; // star ↔ words
const GAP_LINES = 160; // between lines of words

// ISLAMIC LIBRARY, scaled so the line is as wide as AL-ZAHRA, letters spaced as they were on the arc.
const lib = (() => {
  const left = Math.min(...LIBRARY.map((l) => l.dx - (l.cx - l.minx)));
  const right = Math.max(...LIBRARY.map((l) => l.dx + (l.maxx - l.cx)));
  const k = BLOCK_W / (right - left);
  return { k, mid: (left + right) / 2, height: Math.max(...LIBRARY.map((l) => l.maxy - l.miny)) * k };
})();

const zTop = STAR_R * 2 + GAP_STAR;
const zBottom = zTop + (ZAHRA.maxy - ZAHRA.miny);
const lTop = zBottom + GAP_LINES;
const lBottom = lTop + lib.height;
const hTop = lBottom + GAP_LINES;
const hBottom = hTop + (HOUSTON.maxy - HOUSTON.miny);
const starsBottomY = hBottom + GAP_STAR + STAR_R;
const H = starsBottomY + STAR_R;
const W = BLOCK_X + BLOCK_W + 10;

const pair = (y: number) =>
  [MID - STAR_R - STAR_GAP / 2, MID + STAR_R + STAR_GAP / 2].map((x) => starPoints(x, y, STAR_R));

export default function FooterLogo({ className = "" }: { className?: string }) {
  const flowerY = H / 2 - 4 * 217.5;
  return (
    <svg className={className} viewBox={`0 0 ${Math.round(W)} ${Math.round(H)}`} role="img" aria-label="Al-Zahra Islamic Library, IEC Houston" focusable="false">
      {/* the flower, on the left */}
      <g transform={`translate(-12 ${flowerY}) scale(4)`} fill="none" stroke={GOLD} strokeWidth="14" strokeLinejoin="miter" strokeLinecap="butt">
        {Object.entries(FLOWER_PATHS).map(([name, d]) => (
          <path key={name} d={d} />
        ))}
      </g>

      {/* two stars together above the words, two together below, centred on them */}
      <g fill={GOLD}>
        {pair(STAR_R).map((p, i) => (
          <polygon key={`a${i}`} points={p} />
        ))}
        {pair(starsBottomY).map((p, i) => (
          <polygon key={`b${i}`} points={p} />
        ))}
      </g>

      {/* AL-ZAHRA */}
      <path fill={LETTERS} fillRule="evenodd" d={ZAHRA.d} transform={`translate(${BLOCK_X - ZAHRA.minx} ${zTop - ZAHRA.miny})`} />

      {/* ISLAMIC LIBRARY: the emblem's letters, straight */}
      {LIBRARY.map((l, i) => (
        <path
          key={i}
          fill={LETTERS}
          fillRule="evenodd"
          d={l.d}
          // each letter stands on the same line (its own bottom edge sits at lBottom), centred where it was on the arc
          transform={`translate(${MID + (l.dx - lib.mid) * lib.k} ${lBottom}) scale(${lib.k}) translate(${-l.cx} ${-l.maxy})`}
        />
      ))}

      {/* IEC-HOUSTON */}
      <path
        fill={GOLD}
        fillRule="evenodd"
        d={HOUSTON.d}
        transform={`translate(${MID - (HOUSTON.minx + HOUSTON.maxx) / 2} ${hTop - HOUSTON.miny})`}
      />
    </svg>
  );
}
