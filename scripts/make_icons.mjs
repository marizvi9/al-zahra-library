// Makes the browser-tab icon (favicon) set from the library's gold flower.
// The flower's lines are copied from src/components/Emblem.tsx (FLOWER_PATHS), drawn a little
// bolder so it stays readable at 16 px, gold on a navy rounded square (visible on light and dark tabs).
// Run:  node scripts/make_icons.mjs      Needs sharp (already installed) and ImageMagick ("magick").
//   src/app/icon.svg          (the sharp, scalable version)
//   src/app/favicon.ico       (16, 32, 48 px)
//   src/app/apple-icon.png    (180 px, full square: iOS rounds the corners itself)
//   public/brand/icon-192.png, icon-512.png   (Android / home screen, listed in src/app/manifest.ts)
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const NAVY = "#04142e";
const GOLD = "#d4af55"; // the emblem's gold, a touch lighter so it shines on navy
const PATHS = [
  "M142 420 Q283 345 424 420",
  "M283 218 V380",
  "M10 128 L77 286 C150 268 232 306 278 378",
  "M556 128 L489 286 C416 268 334 306 288 378",
  "M10 128 C95 104 205 118 283 218",
  "M556 128 C471 104 361 118 283 218",
  "M122 121 C119 92 127 62 142 40 C181 42 211 55 230 73",
  "M444 121 C447 92 439 62 424 40 C385 42 355 55 336 73",
  "M283 15 C232 68 196 140 205 202 C212 256 250 296 283 320 C316 296 354 256 361 202 C370 140 334 68 283 15 Z",
];

// Tab sizes (16–48 px) get a simpler flower: bud, wings and leaves only, drawn bold, so nothing smudges together.
const SIMPLE = [PATHS[8], PATHS[2], PATHS[3], PATHS[4], PATHS[5]];

/** The icon as SVG. `round` = rounded square (tab icon); false = full square (home-screen icons). `fill` = how wide the flower is (0–1). */
const svg = ({ round = true, fill = 0.74, stroke = 36, paths = PATHS } = {}) => {
  const s = (64 * fill) / 566; // flower is 566 wide
  const x = 32 - 283 * s;
  const y = 32 - 217 * s; // the flower's visual middle
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="${round ? 14 : 0}" fill="${NAVY}"/>
<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(5)})" fill="none" stroke="${GOLD}" stroke-width="${stroke}" stroke-linejoin="miter" stroke-linecap="butt">
${paths.map((d) => `<path d="${d}"/>`).join("\n")}
</g>
</svg>
`;
};

const png = (markup, size, file) => sharp(Buffer.from(markup), { density: 600 }).resize(size, size).png().toFile(file);

fs.writeFileSync("src/app/icon.svg", svg({ fill: 0.8, stroke: 46, paths: SIMPLE }));
await png(svg({ round: false, fill: 0.62, stroke: 30 }), 180, "src/app/apple-icon.png");
await png(svg({ round: false, fill: 0.56, stroke: 30 }), 192, "public/brand/icon-192.png"); // room around it for round "maskable" crops
await png(svg({ round: false, fill: 0.56, stroke: 30 }), 512, "public/brand/icon-512.png");

const tmp = "/tmp/claude-1000/-home-mahdir-projects-al-zahra-library/d302c39e-a384-455d-be5a-950b40253d4c/scratchpad";
const parts = [];
for (const n of [16, 32, 48]) {
  const f = `${tmp}/ico-${n}.png`;
  await png(svg({ fill: 0.82, stroke: n <= 16 ? 62 : n <= 32 ? 54 : 46, paths: SIMPLE }), n, f);
  parts.push(f);
}
execFileSync("magick", [...parts, "src/app/favicon.ico"]);
console.log("icons written");
