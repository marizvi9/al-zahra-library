// The footer's horizontal logo, drawn as SVG with a transparent background (sharp at any size).
// The lettering is the emblem's OWN lettering: AL-ZAHRA, ISLAMIC LIBRARY and IEC-HOUSTON were
// cut out of public/brand/emblem.png and traced to vector outlines (scripts/trace_lettering.mjs →
// lettering.ts). ISLAMIC LIBRARY keeps its letter shapes and spacing but is laid in a straight line.
// The flower and stars are the emblem's too (Emblem.tsx): two stars stand one above the other to the right of the words. The footer is dark navy, so the emblem's
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
const MID = BLOCK_X + BLOCK_W / 2; // the middle of the words

const STAR_R = 135; // small
const STAR_GAP = 90; // space between the two stars
const STAR_SPACE = 260; // words ↔ stars
const GAP_LINES = 215; // between lines of words (a little airier than the emblem, to balance the flower)

// ISLAMIC LIBRARY, scaled so the line is as wide as AL-ZAHRA, letters spaced as they were on the arc.
const lib = (() => {
  const left = Math.min(...LIBRARY.map((l) => l.dx - (l.cx - l.minx)));
  const right = Math.max(...LIBRARY.map((l) => l.dx + (l.maxx - l.cx)));
  const k = BLOCK_W / (right - left);
  return { k, mid: (left + right) / 2, height: Math.max(...LIBRARY.map((l) => l.maxy - l.miny)) * k };
})();

const CAP_HEIGHT = 0.698; // IBM Plex Sans Arabic: capital letters are 0.698 of the font size
const LIB_SIZE = lib.height / CAP_HEIGHT; // capitals exactly as tall as the traced ones
// Where each word sat in the emblem: ISLAMIC is the first 7 traced letters, LIBRARY the rest.
const LIB_WORDS = [LIBRARY.slice(0, 7), LIBRARY.slice(7)].map((ls) => {
  const left = Math.min(...ls.map((l) => MID + (l.dx - lib.mid - (l.cx - l.minx)) * lib.k));
  const right = Math.max(...ls.map((l) => MID + (l.dx - lib.mid + (l.maxx - l.cx)) * lib.k));
  return { text: ls.map((l) => l.ch).join(""), left, width: right - left };
});

const zTop = 0;
const zBottom = zTop + (ZAHRA.maxy - ZAHRA.miny);
const lTop = zBottom + GAP_LINES;
const lBottom = lTop + lib.height;
const hTop = lBottom + GAP_LINES;
const hBottom = hTop + (HOUSTON.maxy - HOUSTON.miny);
const H = hBottom;
const PAD = 310; // empty room above and below, so the logo shows at the same size as before the stars moved
const STAR_X = BLOCK_X + BLOCK_W + STAR_SPACE + STAR_R; // the two stars, one above the other, to the right of the words
const W = STAR_X + STAR_R + 10;
const stars = [H / 2 - STAR_R - STAR_GAP / 2, H / 2 + STAR_R + STAR_GAP / 2].map((y) => starPoints(STAR_X, y, STAR_R));

export default function FooterLogo({ className = "" }: { className?: string }) {
  const flowerY = H / 2 - 4 * 217.5;
  return (
    <svg className={className} viewBox={`0 ${-PAD} ${Math.round(W)} ${Math.round(H + 2 * PAD)}`} role="img" aria-label="Al-Zahra Islamic Library, IEC Houston" focusable="false">
      {/* the flower, on the left */}
      <g transform={`translate(-12 ${flowerY}) scale(4)`} fill="none" stroke={GOLD} strokeWidth="14" strokeLinejoin="miter" strokeLinecap="butt">
        {Object.entries(FLOWER_PATHS).map(([name, d]) => (
          <path key={name} d={d} />
        ))}
      </g>

      {/* two stars, one above the other, to the right of the words */}
      <g fill={GOLD}>
        {stars.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
      </g>

      {/* AL-ZAHRA */}
      <path fill={LETTERS} fillRule="evenodd" d={ZAHRA.d} transform={`translate(${BLOCK_X - ZAHRA.minx} ${zTop - ZAHRA.miny})`} />

      {/* ISLAMIC LIBRARY: each word covers exactly the width it had in the emblem (from the left edge of
          its first traced letter to the right edge of its last), with its letters evenly spaced inside
          that width, in the emblem's lettering font so every letter stands upright. */}
      {LIB_WORDS.map((w) => (
        <text
          key={w.text}
          x={w.left}
          y={lBottom}
          textLength={w.width}
          lengthAdjust="spacing"
          fill={LETTERS}
          fontFamily="var(--font-brand), sans-serif"
          fontWeight="500"
          fontSize={LIB_SIZE}
        >
          {w.text}
        </text>
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
