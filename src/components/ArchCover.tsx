// The library's own drawn cover, used for every book that has no real cover picture.
// (The file keeps its old name, ArchCover, so every list and page uses it automatically.)
//
// Each cover is drawn as SVG from the book's own details, so nothing is downloaded:
//  - a bold title (wrapped over several lines; long titles shrink to fit),
//  - the library's flower emblem at the top,
//  - the author at the bottom, or "Unknown",
//  - a colour taken from the book itself (navy / gold / parchment family), different for almost every book,
//    with text that is always easy to read against it,
//  - a geometric Islamic star pattern behind. No people, animals, Quran verses or sacred names.
// It looks the same on the server and in the browser (it only depends on the title, author and slug).

import { FLOWER_PATHS } from "./Emblem";

type Props = {
  title: string;
  /** The author as written in the catalogue (or "Unknown"). */
  author?: string | null;
  /** Anything stable and unique for the book (its slug); it picks the colours and pattern. */
  seed?: string;
  size?: "large" | "small";
  className?: string;
};

// ---------- Colour ----------

type Scheme = { bg: string; panel: string; title: string; accent: string; ink: string };

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${Math.round(s)}% ${l.toFixed(1)}%)`;

function luminance(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(f(0)) + 0.7152 * lin(f(8)) + 0.0722 * lin(f(4));
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Five families, each shifted a little per book so neighbours on a shelf don't look alike. */
function scheme(seed: string): Scheme {
  const n = hash(seed);
  const family = n % 5;
  const j = (k: number, range: number) => ((n >>> (k * 3)) % 1000) / 1000 * range - range / 2; // small, repeatable shifts
  const gold = hsl(43 + j(1, 6), 62, 52);
  const parch = hsl(42 + j(2, 6), 52, 92);
  const navyInk = hsl(218, 70, 9);
  let bgH: number, bgS: number, bgL: number, panelL: number;
  switch (family) {
    case 0: // deep navy, parchment title
      bgH = 218 + j(3, 26); bgS = 62; bgL = 13 + j(4, 5);
      return build(bgH, bgS, bgL, bgL + 7, parch, gold, parch);
    case 1: // parchment, navy title
      bgH = 41 + j(3, 8); bgS = 48; bgL = 86 + j(4, 6);
      return build(bgH, bgS, bgL, bgL + 5, hsl(220, 72, 14), hsl(40, 66, 38), navyInk);
    case 2: // gold, navy title
      bgH = 42 + j(3, 8); bgS = 58; bgL = 52 + j(4, 6);
      return build(bgH, bgS, bgL, bgL + 9, hsl(220, 80, 8), hsl(220, 70, 14), navyInk);
    case 3: // royal navy-blue, gold title
      bgH = 214 + j(3, 20); bgS = 50; bgL = 25 + j(4, 6);
      return build(bgH, bgS, bgL, bgL - 8, gold, hsl(43, 70, 62), parch);
    default: // ink navy with gold edges, light-gold title
      bgH = 226 + j(3, 18); bgS = 54; bgL = 9 + j(4, 3);
      return build(bgH, bgS, bgL, bgL + 6, hsl(44, 72, 70), gold, parch);
  }
  void panelL;
}

function build(h: number, s: number, l: number, panelL: number, title: string, accent: string, ink: string): Scheme {
  const bg = hsl(h, s, l);
  const panel = hsl(h, s, Math.max(3, Math.min(97, panelL)));
  // Safety net: if a colour combination ever reads poorly, use plain navy + parchment.
  const titleLum = (() => {
    const m = /hsl\((\d+) (\d+)% ([\d.]+)%\)/.exec(title)!;
    return luminance(+m[1], +m[2], +m[3]);
  })();
  if (contrast(titleLum, luminance(h, s, Math.max(3, Math.min(97, panelL)))) < 5) {
    return { bg: "hsl(218 62% 13%)", panel: "hsl(218 62% 19%)", title: "hsl(42 52% 92%)", accent: "hsl(43 62% 52%)", ink: "hsl(42 52% 92%)" };
  }
  return { bg, panel, title, accent, ink: ink === title ? title : ink };
}

// ---------- Text ----------

const RTL = /[֐-߿ﭐ-﷿ﹰ-﻾]/;

/** Rough text width (units of font size) per character; Arabic-script letters are a little narrower. */
const charW = (ch: number) => (ch >= 0x600 ? 0.5 : 0.6);
const widthOf = (text: string, size: number) => {
  let w = 0;
  for (const c of text) w += charW(c.codePointAt(0)!) * size;
  return w;
};

function wrap(text: string, size: number, maxW: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (widthOf(next, size) <= maxW || !line) {
      line = next;
    } else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  return out;
}

/** Biggest size at which the title fits the panel: wraps over several lines, shrinks when long. */
function fitTitle(title: string, maxW: number, maxH: number) {
  for (let size = 44; size >= 15; size -= 1) {
    const lines = wrap(title, size, maxW);
    const longest = Math.max(...lines.map((l) => widthOf(l, size)));
    if (lines.length * size * 1.18 <= maxH && longest <= maxW + 0.5) return { size, lines };
  }
  // Extremely long: cut it so it still fits, with an ellipsis.
  const size = 15;
  const max = Math.floor(maxH / (size * 1.18));
  const lines = wrap(title, size, maxW).slice(0, max);
  lines[lines.length - 1] = lines[lines.length - 1].replace(/[\s,;:.-]*$/, "") + "…";
  return { size, lines };
}

function fitAuthor(author: string, maxW: number) {
  for (let size = 19; size >= 12; size -= 1) {
    const lines = wrap(author, size, maxW);
    if (lines.length <= 2) return { size, lines };
  }
  const lines = wrap(author, 12, maxW).slice(0, 2);
  lines[1] = (lines[1] ?? "").replace(/[\s,;:.-]*$/, "") + "…";
  return { size: 12, lines };
}

// ---------- Pattern ----------

function Pattern({ id, kind, stroke }: { id: string; kind: number; stroke: string }) {
  const common = { fill: "none", stroke, strokeWidth: 1.2, strokeLinejoin: "round" as const };
  if (kind === 0)
    return (
      <pattern id={id} width="60" height="60" patternUnits="userSpaceOnUse">
        <g {...common}>
          <path d="M17 17H43V43H17Z" />
          <path d="M30 12L48 30L30 48L12 30Z" />
          <path d="M30 0V12M30 48V60M0 30H12M48 30H60M0 0L17 17M60 0L43 17M0 60L17 43M60 60L43 43" />
          <circle cx="30" cy="30" r="4.5" />
        </g>
      </pattern>
    );
  if (kind === 1)
    return (
      <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
        <g {...common}>
          <path d="M24 0L48 24L24 48L0 24Z" />
          <path d="M24 10L38 24L24 38L10 24Z" />
          <circle cx="24" cy="24" r="3" />
          <circle cx="0" cy="0" r="3" />
          <circle cx="48" cy="0" r="3" />
          <circle cx="0" cy="48" r="3" />
          <circle cx="48" cy="48" r="3" />
        </g>
      </pattern>
    );
  return (
    <pattern id={id} width="52" height="60" patternUnits="userSpaceOnUse">
      <g {...common}>
        <path d="M26 6L46 18V42L26 54L6 42V18Z" />
        <path d="M26 18L36 24V36L26 42L16 36V24Z" />
        <path d="M26 0V6M26 54V60M0 18L6 18M46 18L52 18M0 42L6 42M46 42L52 42" />
      </g>
    </pattern>
  );
}

// ---------- The cover ----------

export default function ArchCover({ title, author, seed, size = "large", className = "" }: Props) {
  const key = seed || title;
  const c = scheme(key);
  const kind = (hash(key + "p") >>> 3) % 3;
  const pid = `gc-${hash(key).toString(36)}`;
  const rtl = RTL.test(title);

  const t = fitTitle(title.trim() || "Untitled", 224, 196);
  const who = author && !/^published by/i.test(author) && author.trim() ? author.trim() : "Unknown";
  const a = fitAuthor(who, 224);

  const titleH = t.lines.length * t.size * 1.18;
  const titleTop = 118 + (196 - titleH) / 2; // centred in the panel (panel spans y 118–314)
  const authorTop = 366 - ((a.lines.length - 1) * a.size * 1.2) / 2;

  return (
    <svg
      className={`generated-cover generated-cover-${size} ${className}`}
      viewBox="0 0 300 440"
      role="img"
      aria-label={`Cover drawn by the library: ${title}, ${who}`}
      focusable="false"
    >
      <defs>
        <Pattern id={pid} kind={kind} stroke={c.accent} />
      </defs>
      <rect width="300" height="440" rx="6" fill={c.bg} />
      <rect width="300" height="440" rx="6" fill={`url(#${pid})`} opacity="0.3" />
      {/* double frame */}
      <rect x="10" y="10" width="280" height="420" rx="3" fill="none" stroke={c.accent} strokeWidth="3" />
      <rect x="18" y="18" width="264" height="404" rx="2" fill="none" stroke={c.accent} strokeWidth="1" opacity="0.8" />

      {/* emblem: the library's flower */}
      <svg x="110" y="30" width="80" height="62" viewBox="-8 0 582 432" aria-hidden="true">
        <g fill="none" stroke={c.accent} strokeWidth="22" strokeLinejoin="miter" strokeLinecap="butt">
          {Object.entries(FLOWER_PATHS).map(([name, d]) => (
            <path key={name} d={d} />
          ))}
        </g>
      </svg>
      <text x="150" y="108" textAnchor="middle" fontSize="9.5" letterSpacing="3" fill={c.accent} style={{ fontFamily: "var(--font-ui), sans-serif", fontWeight: 700 }}>
        AL-ZAHRA LIBRARY
      </text>

      {/* title panel */}
      <rect x="30" y="118" width="240" height="196" rx="8" fill={c.panel} opacity="0.86" />
      <text
        x="150"
        y={titleTop}
        textAnchor="middle"
        direction={rtl ? "rtl" : "ltr"}
        fill={c.title}
        fontSize={t.size}
        style={{ fontFamily: "var(--font-head), Georgia, serif", fontWeight: 800 }}
      >
        {t.lines.map((l, i) => (
          <tspan key={i} x="150" dy={i === 0 ? t.size * 0.95 : t.size * 1.18}>
            {l}
          </tspan>
        ))}
      </text>

      {/* divider */}
      <path d="M70 336H138M162 336H230" stroke={c.accent} strokeWidth="1.5" />
      <path d="M150 329L157 336L150 343L143 336Z" fill={c.accent} />

      {/* author */}
      <text
        x="150"
        y={authorTop}
        textAnchor="middle"
        fill={c.ink}
        fontSize={a.size}
        direction={RTL.test(who) ? "rtl" : "ltr"}
        style={{ fontFamily: "var(--font-head), Georgia, serif", fontWeight: 600 }}
      >
        {a.lines.map((l, i) => (
          <tspan key={i} x="150" dy={i === 0 ? a.size * 0.35 : a.size * 1.2}>
            {l}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
