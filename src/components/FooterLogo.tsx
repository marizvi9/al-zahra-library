// The footer's horizontal logo, drawn as SVG with a transparent background (sharp at any size).
// The lettering is the emblem's OWN lettering: AL-ZAHRA, ISLAMIC LIBRARY and IEC-HOUSTON were
// cut out of public/brand/emblem.png and traced to vector outlines (scripts/trace_lettering.mjs →
// lettering.ts). ISLAMIC LIBRARY is set in the emblem's lettering font (as on the round emblem), upright.
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
const CAP_HEIGHT = 0.698; // IBM Plex Sans Arabic: capital letters are 0.698 of the font size

// ISLAMIC LIBRARY, scaled so the line is as wide as AL-ZAHRA, letters spaced as they were on the arc.
const lib = (() => {
  const left = Math.min(...LIBRARY.map((l) => l.dx - (l.cx - l.minx)));
  const right = Math.max(...LIBRARY.map((l) => l.dx + (l.maxx - l.cx)));
  const k = BLOCK_W / (right - left);
  return { k, mid: (left + right) / 2, height: Math.max(...LIBRARY.map((l) => l.maxy - l.miny)) * k };
})();

const LIB_SIZE = Math.round(lib.height / CAP_HEIGHT);
// Letter spacing for ISLAMIC LIBRARY. The 14 capitals average 0.586 of the font size wide in this font
// (measured in the browser). The spacing T is chosen so that both words plus a word gap of about 2.6 T
// (a natural word space) span exactly the width of AL-ZAHRA: width = letters + 12 T + 2.6 T + T.
const LIB_TRACK = Math.round((BLOCK_W - 14 * 0.586 * LIB_SIZE) / 15.6);

const GAP_LINES = 290; // between lines of words (open)

const zTop = 0;
const zBottom = zTop + (ZAHRA.maxy - ZAHRA.miny);
const lTop = zBottom + GAP_LINES;
const lBottom = lTop + lib.height;
const hTop = lBottom + GAP_LINES;
const hBottom = hTop + (HOUSTON.maxy - HOUSTON.miny);
const H = hBottom;
// The words and stars sit this much lower than the flower's middle (a slightly lower block reads as
// centred beside the flower's tall petals).
const WORDS_DROP = 45;
const PAD = 180; // empty room above and below (310 - 130, so the wider line gaps keep the logo the same size)
const STAR_X = BLOCK_X + BLOCK_W + STAR_SPACE + STAR_R; // the two stars, one above the other, to the right of the words
const W = STAR_X + STAR_R + 10;
const stars = [H / 2 - STAR_R - STAR_GAP / 2, H / 2 + STAR_R + STAR_GAP / 2].map((y) => starPoints(STAR_X, y, STAR_R));

export default function FooterLogo({ className = "" }: { className?: string }) {
  // + 7: the flower's drawn middle sat 7 units above the middle of the words and stars (measured); this centres them.
  const flowerY = H / 2 - 4 * 217.5 + 7;
  return (
    <svg className={className} viewBox={`0 ${-PAD} ${Math.round(W)} ${Math.round(H + 2 * PAD)}`} role="img" aria-label="Al-Zahra Islamic Library, IEC Houston" focusable="false">
      {/* the flower, on the left */}
      <g transform={`translate(-12 ${flowerY}) scale(4)`} fill="none" stroke={GOLD} strokeWidth="14" strokeLinejoin="miter" strokeLinecap="butt">
        {Object.entries(FLOWER_PATHS).map(([name, d]) => (
          <path key={name} d={d} />
        ))}
      </g>

      {/* the words and the two stars, lowered a little (WORDS_DROP) beside the flower */}
      <g transform={`translate(0 ${WORDS_DROP})`}>
      {/* two stars, one above the other, to the right of the words */}
      <g fill={GOLD}>
        {stars.map((p, i) => (
          <polygon key={i} points={p} />
        ))}
      </g>

      {/* AL-ZAHRA */}
      <path fill={LETTERS} fillRule="evenodd" d={ZAHRA.d} transform={`translate(${BLOCK_X - ZAHRA.minx} ${zTop - ZAHRA.miny})`} />

      {/* ISLAMIC LIBRARY: set in the emblem's own lettering font (as on the round emblem), so every
          letter stands upright. Each word is spaced on its own: ISLAMIC starts at the left edge of
          AL-ZAHRA, LIBRARY ends at its right edge, with a clear word gap between them. */}
      {(["ISLAMIC", "LIBRARY"] as const).map((word, i) => (
        <text
          key={word}
          x={i === 0 ? BLOCK_X : BLOCK_X + BLOCK_W}
          y={lBottom}
          textAnchor={i === 0 ? "start" : "end"}
          fill={LETTERS}
          fontFamily="var(--font-brand), sans-serif"
          fontWeight="500"
          fontSize={LIB_SIZE}
          letterSpacing={LIB_TRACK}
        >
          {word}
        </text>
      ))}

      {/* IEC-HOUSTON */}
      <path
        fill={GOLD}
        fillRule="evenodd"
        d={HOUSTON.d}
        transform={`translate(${MID - (HOUSTON.minx + HOUSTON.maxx) / 2} ${hTop - HOUSTON.miny})`}
      />
      </g>
    </svg>
  );
}
