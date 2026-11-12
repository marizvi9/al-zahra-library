// The footer's horizontal logo, drawn as SVG (transparent background, sharp at any size), from the
// parts of the original emblem (public/brand/emblem.png): the gold flower on the left; on the right
// AL-ZAHRA, ISLAMIC LIBRARY and IEC HOUSTON, with two gold stars above the words and two below.
// The footer is dark navy, so the emblem's navy lettering becomes parchment here; the gold stays gold.
// Real text, set in the site's own font (the same one the emblem's lettering was matched to).
import { FLOWER_PATHS, starPoints } from "./Emblem";

const GOLD = "#d4af55"; // the emblem's gold, lightened a little so it glows on navy
const PARCHMENT = "#f7f1e1";

export default function FooterLogo({ className = "" }: { className?: string }) {
  // Words sit in x 470–990 (centre 730). Stars flank that block: two above, two below.
  const stars = [
    [490, 24],
    [970, 24],
    [490, 288],
    [970, 288],
  ];
  return (
    <svg className={className} viewBox="0 0 1000 312" role="img" aria-label="Al-Zahra Islamic Library, IEC Houston" focusable="false">
      <g transform="translate(-4 22) scale(0.66)" fill="none" stroke={GOLD} strokeWidth="14" strokeLinejoin="miter" strokeLinecap="butt">
        {Object.entries(FLOWER_PATHS).map(([name, d]) => (
          <path key={name} d={d} />
        ))}
      </g>
      <g fill={GOLD}>
        {stars.map(([x, y], i) => (
          <polygon key={i} points={starPoints(x, y, 17)} />
        ))}
      </g>
      <g textAnchor="middle" style={{ fontFamily: "var(--font-brand), sans-serif" }}>
        <text x="730" y="148" fill={PARCHMENT} fontWeight="700" fontSize="132" textLength="520" lengthAdjust="spacingAndGlyphs">
          AL-ZAHRA
        </text>
        <text x="730" y="208" fill={PARCHMENT} fontWeight="500" fontSize="42" letterSpacing="11">
          ISLAMIC LIBRARY
        </text>
        <text x="730" y="262" fill={GOLD} fontWeight="500" fontSize="36" letterSpacing="14">
          IEC HOUSTON
        </text>
      </g>
    </svg>
  );
}
