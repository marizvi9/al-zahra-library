// Cover artwork for each category, drawn in code as SVG (sharp at any size, tiny to load).
// Every cover shares one style, so they read as a set:
//   - a deep navy panel with a faint eight-pointed-star lattice,
//   - a gold double frame with small corner stars,
//   - one simple gold line motif in the centre that stands for the category,
//   - the shelf number set in the emblem's lettering.
// No people or animals, and no Quranic verses or sacred names as decoration.
//
// Motifs (one per category):
//   Theology ............ eight-point star within rings (the oneness of God)
//   Philosophy .......... compass-drawn circles (reason and order)
//   Fiqh ................ balanced scales (law and justice)
//   Governance .......... interlocking hexagons (a community holding together)
//   Comparative Religion  three overlapping circles (dialogue)
//   Schools of Thought .. a tree with branches spreading from one trunk
//   Quranic Studies ..... an open book on a folding book stand (rehal); pages left blank
//   Hadith & Ahlul-Bayt . a hanging lamp (qandil): teaching as light
//   History ............. arches receding into the distance (time)
//   Stories & Reflections a crescent and stars
//   Biography ........... a winding path to a sunset between cypress trees (a life's journey)
//   Literature & Poetry . a reed pen (qalam) and inkwell
//   Duas, Ziyarat & Amaal prayer beads around a dome
//   Ethics .............. a fountain (purity)
//   Miscellaneous ....... a cluster of different girih tiles
//   French / Italian .... the word "Français" / "Italiano" set in type
//   Uncategorized ....... a plain ring of stars

import { useId, type ReactNode } from "react";

const GOLD = "#d4af55"; // emblem gold, lightened so it shows clearly on navy
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
      <polygon points={hexagon(0, 0, 20)} fill={GOLD} fillOpacity="0.18" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const d = 20 * Math.sqrt(3);
        return <polygon key={i} points={hexagon(d * Math.cos(a), d * Math.sin(a), 20)} />;
      })}
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
      <path d={arch(0, 52, 108, 108)} />
      <path d={arch(0, 40, 74, 80)} strokeOpacity="0.8" />
      <path d={arch(0, 30, 46, 54)} strokeOpacity="0.6" />
      <path d={arch(0, 22, 24, 30)} strokeOpacity="0.45" />
      <path d="M-54 52 L-12 22 M54 52 L12 22" strokeOpacity="0.5" />
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
      {Array.from({ length: 33 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 33 - Math.PI / 2;
        return <circle key={i} cx={(54 * Math.cos(a)).toFixed(1)} cy={(4 + 54 * Math.sin(a)).toFixed(1)} r="3.6" fill={GOLD} stroke="none" />;
      })}
      <path d="M-24 30 V6 Q-24 -16 0 -30 Q24 -16 24 6 V30 Z" fill={GOLD} fillOpacity="0.15" />
      <path d="M0 -30 V-40 M-30 30 H30" />
      <path d="M-8 30 V16 Q0 8 8 16 V30" strokeOpacity="0.8" />
    </>
  ),
  ethics: () => (
    <>
      <polygon points={star(0, 34, 50, 8, 0.82)} transform="scale(1 0.42) translate(0 46)" />
      <path d="M0 22 V-28" />
      <path d="M0 -28 Q-26 -40 -40 10 M0 -28 Q26 -40 40 10 M0 -28 Q-12 -44 -20 4 M0 -28 Q12 -44 20 4" strokeOpacity="0.8" />
      <circle cy="-32" r="5" fill={GOLD} stroke="none" />
      <path d="M-30 22 H30" />
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
  return (
    <svg className={`category-cover ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f2547" />
          <stop offset="1" stopColor="#04142e" />
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
