// Cover artwork for each category, drawn in code as SVG (sharp at any size, tiny to load).
// Every cover shares one style, so they read as a family:
//   - a deep panel in the category's OWN colour, with a faint eight-pointed-star lattice,
//   - a gold double frame with small corner stars,
//   - one simple gold line motif in the centre that stands for the category,
//   - the shelf number set in the emblem's lettering.
// Each colour is dark enough that the gold lettering passes WCAG AA contrast (4.5:1 or more).
// No people or animals (not even hands), and no Quranic verses or sacred names as decoration.
//
// Category ............ colour ......................... motif
//   Theology ............ navy #0F2547 ................... eight-point star within rings (the oneness of God)
//   Philosophy .......... indigo #2A2A66 ................. compass-drawn circles (reason and order)
//   Fiqh ................ deep teal #0D4648 .............. balanced scales (law and justice)
//   Governance .......... burgundy #621B2E ............... a city skyline of domes and towers (society)
//   Comparative Religion  steel blue #163C5C ............. three overlapping circles (dialogue)
//   Schools of Thought .. forest green #1C4A2B ........... a tree with branches spreading from one trunk
//   Quranic Studies ..... emerald #0C4D3C ................ an open book with fanned pages on a book stand (rehal); pages blank
//   Hadith & Ahlul-Bayt . bronze #553A12 ................. a hanging lamp (qandil): teaching as light
//   History ............. terracotta #66301A ............. an hourglass beneath an arch (the passing of time)
//   Stories & Reflections twilight violet #35215A ........ a crescent and stars (stories told at night)
//   Biography ........... dusk rose #5A2246 .............. a winding path to a sunset between cypress trees (a life's journey)
//   Literature & Poetry . oxblood #5E1B1B ................ a reed pen (qalam) and inkwell
//   Duas, Ziyarat & Amaal turquoise #0B4A5E .............. a prayer mat with a mihrab arch, and prayer beads (tasbih)
//   Ethics .............. moss green #2F4A1C ............. a compass rose (a moral compass)
//   Miscellaneous ....... warm taupe #463C33 ............. a cluster of different girih tiles
//   French .............. cobalt #1E2E6E ................. the word "Français" set in type
//   Italian ............. olive #3E4517 .................. the word "Italiano" set in type
//   Uncategorized ....... charcoal #2E3238 ............... a plain ring of stars

import { useId, type ReactNode } from "react";

const GOLD = "#d4af55"; // emblem gold, lightened so it shows clearly on the dark panels

/** Each category's panel colour (top of the panel; it deepens towards the bottom). */
export const CATEGORY_COLORS: Record<string, string> = {
  theology: "#0F2547",
  philosophy: "#2A2A66",
  fiqh: "#0D4648",
  "governance-politics-and-society": "#621B2E",
  "comparative-religion": "#163C5C",
  "islamic-schools-of-thought": "#1C4A2B",
  "quranic-studies": "#0C4D3C",
  "hadith-and-ahlal-bayt-teachings": "#553A12",
  history: "#66301A",
  "stories-and-reflections": "#35215A",
  biography: "#5A2246",
  "literature-and-poetry": "#5E1B1B",
  "duas-ziyarat-and-amaal": "#0B4A5E",
  ethics: "#2F4A1C",
  miscellaneous: "#463C33",
  french: "#1E2E6E",
  italian: "#3E4517",
  uncategorized: "#2E3238",
};

/** The same colour, darker (f = 0.55 keeps 55% of the brightness). */
function deepen(hex: string, f = 0.55) {
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, "0"))
      .join("")
  );
}
const W = 320;
const H = 200;
const CX = 160;
const CY = 92;

/** n-point star polygon (for small decorative stars). */
function star(cx: number, cy: number, r: number, n = 8, inner = 0.45) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function hexagon(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/** Pointed (Islamic) arch of width w and height h, standing on (cx, base). */
function arch(cx: number, base: number, w: number, h: number) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const spring = base - h * 0.55;
  return `M${l} ${base} V${spring} Q${l} ${base - h * 0.95} ${cx} ${base - h} Q${r} ${base - h * 0.95} ${r} ${spring} V${base}`;
}

// Each motif is drawn around (0, 0) and fits in roughly ±60 × ±55.
const MOTIFS: Record<string, (id: string) => ReactNode> = {
  theology: () => (
    <>
      <circle r="58" />
      <circle r="50" strokeOpacity="0.5" />
      <rect x="-34" y="-34" width="68" height="68" />
      <rect x="-34" y="-34" width="68" height="68" transform="rotate(45)" />
      <circle r="17" />
      <circle r="4" fill={GOLD} stroke="none" />
    </>
  ),
  philosophy: () => (
    <>
      <circle r="58" />
      <circle r="28" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i;
        return <circle key={i} cx={(28 * Math.cos(a)).toFixed(1)} cy={(28 * Math.sin(a)).toFixed(1)} r="28" strokeOpacity="0.85" />;
      })}
      <circle r="3.5" fill={GOLD} stroke="none" />
    </>
  ),
  fiqh: () => (
    <>
      <path d="M0 -50 V46 M-26 50 H26 M-14 46 H14" />
      <circle cy="-54" r="4" />
      <path d="M-52 -34 H52" />
      <path d="M-52 -34 L-68 6 M-52 -34 L-36 6 M52 -34 L36 6 M52 -34 L68 6" strokeOpacity="0.8" />
      <path d="M-72 6 Q-52 26 -32 6 Z M32 6 Q52 26 72 6 Z" fill={GOLD} fillOpacity="0.18" />
      <path d="M-8 -34 L0 -44 L8 -34" />
    </>
  ),
  "governance-politics-and-society": () => (
    <>
      {/* a city: a domed hall in the middle, towers and houses either side */}
      <path d="M-66 52 H66" />
      <path d="M-22 52 V10 H22 V52" />
      <path d="M-24 10 Q-24 -24 0 -34 Q24 -24 24 10 Z" fill={GOLD} fillOpacity="0.18" />
      <path d="M0 -34 V-42" />
      <polygon points={star(0, -47, 5)} fill={GOLD} stroke="none" />
      <path d={arch(0, 52, 14, 26)} />
      <path d="M-44 52 V-18 H-32 V52 M-46 -18 L-38 -32 L-30 -18 M32 52 V-18 H44 V52 M30 -18 L38 -32 L46 -18" />
      <path d="M-62 52 V22 L-53 14 L-44 22 M62 52 V22 L53 14 L44 22" strokeOpacity="0.8" />
      <path d={arch(-53, 40, 6, 10)} strokeOpacity="0.8" strokeWidth="1.8" />
      <path d={arch(53, 40, 6, 10)} strokeOpacity="0.8" strokeWidth="1.8" />
      <path d={arch(-38, 4, 4, 9)} strokeWidth="1.6" />
      <path d={arch(38, 4, 4, 9)} strokeWidth="1.6" />
    </>
  ),
  "comparative-religion": () => (
    <>
      <circle cx="0" cy="-17" r="32" />
      <circle cx="-20" cy="17" r="32" />
      <circle cx="20" cy="17" r="32" />
      <circle cx="0" cy="6" r="4" fill={GOLD} stroke="none" />
    </>
  ),
  "islamic-schools-of-thought": () => (
    <>
      {/* one trunk, curved branches spreading both ways, almond leaves */}
      <path d="M0 56 V-6 M0 34 Q-22 26 -40 6 M0 34 Q22 26 40 6 M0 14 Q-18 4 -30 -20 M0 14 Q18 4 30 -20 M0 -6 Q-4 -24 -12 -40 M0 -6 Q6 -26 14 -42" />
      <path d="M-30 56 Q0 48 30 56" />
      {[[-40, 6, -50], [40, 6, 50], [-30, -20, -35], [30, -20, 35], [-12, -40, -15], [14, -42, 20], [-20, 22, -70], [22, 22, 70], [-14, 0, -60], [14, 0, 60]].map(([x, y, r], i) => (
        <path key={i} d="M0 0 Q5 -8 0 -16 Q-5 -8 0 0 Z" transform={`translate(${x} ${y}) rotate(${r})`} fill={GOLD} fillOpacity="0.4" strokeWidth="1.6" />
      ))}
    </>
  ),
  "quranic-studies": () => (
    <>
      {/* open book, pages left blank */}
      <path d="M0 -6 Q-26 -22 -58 -14 V20 Q-26 12 0 26 Q26 12 58 20 V-14 Q26 -22 0 -6 Z" fill={GOLD} fillOpacity="0.12" />
      <path d="M0 -6 V26" />
      <path d="M0 -6 Q-22 -16 -48 -11 M0 -6 Q-18 -12 -38 -9 M0 -6 Q22 -16 48 -11 M0 -6 Q18 -12 38 -9" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M-58 20 V24 Q-26 16 0 30 Q26 16 58 24 V20" strokeOpacity="0.7" strokeWidth="1.8" />
      {/* folding book stand (rehal) */}
      <path d="M-44 24 L30 58 M44 24 L-30 58" />
      <path d="M-50 22 L-36 28 M50 22 L36 28" />
      <polygon points={star(0, -38, 8, 8)} fill={GOLD} stroke="none" />
    </>
  ),
  "hadith-and-ahlal-bayt-teachings": () => (
    <>
      <path d="M0 -62 V-42" />
      <path d="M-12 -42 H12 L18 -32 H-18 Z" />
      <path d="M-18 -32 H18 L34 -2 Q30 24 0 32 Q-30 24 -34 -2 Z" fill={GOLD} fillOpacity="0.1" />
      <path d="M0 -14 Q9 -2 0 12 Q-9 -2 0 -14 Z" fill={GOLD} stroke="none" />
      <path d="M-34 -2 H34" strokeOpacity="0.6" />
      <path d="M0 32 V44 M-10 40 V50 M10 40 V50" />
      <circle cy="48" r="3" fill={GOLD} stroke="none" />
    </>
  ),
  history: () => (
    <>
      {/* an hourglass standing beneath an arch */}
      <path d={arch(0, 56, 104, 114)} strokeOpacity="0.5" />
      <path d="M-28 -38 H28 M-28 46 H28" strokeWidth="3.2" />
      <path d="M-24 -38 V46 M24 -38 V46" strokeOpacity="0.6" strokeWidth="1.8" />
      <path d="M-17 -38 C-17 -12 -4 -4 -3 4 C-4 12 -17 20 -17 46 M17 -38 C17 -12 4 -4 3 4 C4 12 17 20 17 46" />
      <path d="M-11 -18 Q0 -13 11 -18 Q5 -6 0 1 Q-5 -6 -11 -18 Z" fill={GOLD} fillOpacity="0.55" stroke="none" />
      <path d="M0 4 V32" strokeWidth="1.4" />
      <path d="M-15 44 Q0 26 15 44 Z" fill={GOLD} fillOpacity="0.55" stroke="none" />
    </>
  ),
  "stories-and-reflections": (id) => (
    <>
      <mask id={`${id}-moon`}>
        <rect x="-80" y="-80" width="160" height="160" fill="black" />
        <circle cx="-8" cy="0" r="40" fill="white" />
        <circle cx="8" cy="-10" r="34" fill="black" />
      </mask>
      <rect x="-60" y="-50" width="80" height="100" fill={GOLD} stroke="none" mask={`url(#${id}-moon)`} />
      <polygon points={star(34, -26, 9)} fill={GOLD} stroke="none" />
      <polygon points={star(48, 8, 6)} fill={GOLD} stroke="none" />
      <polygon points={star(22, 30, 5)} fill={GOLD} stroke="none" />
    </>
  ),
  biography: () => (
    <>
      {/* sunset on the horizon, a winding path, cypress trees on either side */}
      <path d="M-66 -4 H66" strokeOpacity="0.7" />
      <path d="M-16 -4 A16 16 0 0 1 16 -4" fill={GOLD} fillOpacity="0.3" />
      <path d="M0 -28 V-36 M-17 -21 L-23 -27 M17 -21 L23 -27 M-24 -8 H-32 M24 -8 H32" strokeOpacity="0.8" strokeWidth="2" />
      <path d="M-30 56 Q-2 36 -14 22 Q-24 10 -3 -4 M28 56 Q30 36 10 22 Q-2 12 5 -4" />
      <path d="M-50 50 Q-62 10 -50 -36 Q-38 10 -50 50 Z M-50 50 V56" fill={GOLD} fillOpacity="0.2" />
      <path d="M50 50 Q62 10 50 -36 Q38 10 50 50 Z M50 50 V56" fill={GOLD} fillOpacity="0.2" />
      <path d="M-66 56 H66" strokeOpacity="0.6" />
    </>
  ),
  "literature-and-poetry": () => (
    <>
      {/* reed pen */}
      <path d="M-6 30 L44 -52 L52 -47 L2 35 Z" fill={GOLD} fillOpacity="0.15" />
      <path d="M-6 30 L-12 46 L2 35" />
      {/* inkwell */}
      <path d="M-58 16 H-22 L-18 28 Q-18 52 -40 52 Q-62 52 -62 28 Z" fill={GOLD} fillOpacity="0.12" />
      <path d="M-50 16 V8 H-30 V16" />
      {/* flourish */}
      <path d="M-14 54 Q16 40 30 50 Q44 60 62 44" strokeOpacity="0.8" />
    </>
  ),
  "duas-ziyarat-and-amaal": () => (
    <>
      {/* a prayer mat with a mihrab arch, fringed at the foot */}
      <rect x="-44" y="-50" width="64" height="94" rx="3" fill={GOLD} fillOpacity="0.08" />
      <rect x="-38" y="-44" width="52" height="82" rx="2" strokeOpacity="0.6" strokeWidth="1.6" />
      <path d={arch(-12, 30, 34, 60)} fill={GOLD} fillOpacity="0.16" />
      <polygon points={star(-12, -12, 5)} fill={GOLD} stroke="none" />
      <path d="M-26 30 H2" strokeOpacity="0.7" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${-40 + i * 8} 44 V52`} strokeWidth="1.6" strokeOpacity="0.8" />
      ))}
      {/* prayer beads (tasbih) beside it, with a tassel */}
      {Array.from({ length: 19 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 19 - Math.PI / 2;
        return <circle key={i} cx={(42 + 10 * Math.cos(a)).toFixed(1)} cy={(-2 + 28 * Math.sin(a)).toFixed(1)} r="2.9" fill={GOLD} stroke="none" />;
      })}
      <path d="M42 26 V38" />
      <path d="M42 38 L37 50 M42 38 V51 M42 38 L47 50" strokeWidth="1.6" />
    </>
  ),
  ethics: () => (
    <>
      {/* a compass rose: finding the right direction */}
      <circle r="52" />
      <circle r="44" strokeOpacity="0.5" />
      <polygon points={star(0, 0, 36, 4, 0.3)} transform="rotate(45)" strokeOpacity="0.8" />
      <polygon points={star(0, 0, 58, 4, 0.17)} fill={GOLD} fillOpacity="0.2" />
      <polygon points="0,-58 9.9,-9.9 -9.9,-9.9" fill={GOLD} stroke="none" />
      <circle r="5" fill={GOLD} stroke="none" />
    </>
  ),
  miscellaneous: () => (
    <>
      <polygon points={hexagon(-22, -14, 22)} />
      <polygon points="18,-36 46,-26 46,2 18,-8" fill={GOLD} fillOpacity="0.15" />
      <polygon points={star(26, 30, 22, 5, 0.5)} />
      <path d="M-50 18 L-30 30 L-50 42 L-10 42 L-30 30 L-10 18 Z" fill={GOLD} fillOpacity="0.15" />
    </>
  ),
  uncategorized: () => (
    <>
      <circle r="44" strokeOpacity="0.6" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i - Math.PI / 2;
        return <polygon key={i} points={star(44 * Math.cos(a), 44 * Math.sin(a), 8)} fill={GOLD} stroke="none" />;
      })}
    </>
  ),
};

const WORDS: Record<string, string> = { french: "Français", italian: "Italiano" };

export default function CategoryCover({ slug, number, className = "" }: { slug: string; number: string | null; className?: string }) {
  const id = useId().replace(/:/g, "");
  const motif = MOTIFS[slug];
  const word = WORDS[slug];
  const color = CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.theology;
  return (
    <svg className={`category-cover ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={deepen(color)} />
        </linearGradient>
        <pattern id={`${id}-lattice`} width="40" height="40" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={GOLD} strokeOpacity="0.09" strokeWidth="1">
            <path d="M12 12H28V28H12Z M20 8L32 20L20 32L8 20Z M20 0V8 M20 32V40 M0 20H8 M32 20H40" />
          </g>
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      <rect width={W} height={H} fill={`url(#${id}-lattice)`} />
      {/* gold double frame with corner stars */}
      <g fill="none" stroke={GOLD}>
        <rect x="10" y="10" width={W - 20} height={H - 20} rx="6" strokeWidth="1.4" strokeOpacity="0.85" />
        <rect x="15" y="15" width={W - 30} height={H - 30} rx="4" strokeWidth="0.7" strokeOpacity="0.5" />
      </g>
      {[[15, 15], [W - 15, 15], [15, H - 15], [W - 15, H - 15]].map(([x, y], i) => (
        <polygon key={i} points={star(x, y, 5)} fill={GOLD} />
      ))}
      {/* the motif */}
      {word ? (
        <g textAnchor="middle" fill={GOLD} fontFamily="var(--font-brand), Montserrat, sans-serif">
          <text x={CX} y={CY + 12} fontSize="40" fontWeight="600" letterSpacing="1">
            {word}
          </text>
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${CX + s * 30} ${CY - 34} H${CX + s * 100}`} stroke={GOLD} strokeOpacity="0.5" />
              <polygon points={star(CX + s * 18, CY - 34, 5)} />
            </g>
          ))}
          <polygon points={star(CX, CY - 34, 7)} />
        </g>
      ) : (
        motif && (
          <g transform={`translate(${CX} ${CY})`} fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
            {motif(id)}
          </g>
        )
      )}
      {/* shelf number, in the emblem's lettering */}
      <text
        x={CX}
        y={H - 24}
        textAnchor="middle"
        fill={GOLD}
        fontFamily="var(--font-brand), Montserrat, sans-serif"
        fontWeight="500"
        fontSize="12.5"
        letterSpacing="3.5"
      >
        {number ? `SHELF ${number}` : "NO SHELF NUMBER"}
      </text>
    </svg>
  );
}
