// Traces the lettering of the original emblem (public/brand/emblem.png) into clean vector outlines,
// so the footer logo uses the emblem's own letter shapes, not retyped text.
//   AL-ZAHRA and IEC-HOUSTON: cropped out of the picture and traced as they are.
//   ISLAMIC LIBRARY: each of its 14 letters is found in the picture, turned upright (undoing its place on the arc),
//   then traced on its own. The footer lays them in a straight line.
// Output: src/components/lettering.ts   (all coordinates are the emblem's pixels × 4)
// Run: POTRACE_DIR=<folder where "npm install potrace" was run> node scripts/trace_lettering.mjs
// (potrace is only needed for this one-off step, so it is not a dependency of the site.)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const require = createRequire(path.join(process.env.POTRACE_DIR, "x.js"));
const { Potrace } = require("potrace");

const SRC = "public/brand/emblem.png";
const UP = 4; // work at 4× for smooth curves
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "lettering-"));

// The arc of ISLAMIC LIBRARY is centred here (emblem pixels).
let CX = 705, CY = 720; // first guess; refined below by fitting a circle through the letters

/** Finds the 14 arc letters in the original picture: dark pieces in a ring around the arc's centre. Returns them left to right
 *  with the angle each sits at (degrees, 0 = straight up) and its distance from the centre. */
async function findArcLetters() {
  const { data, info } = await sharp(SRC).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const seen = new Uint8Array(W * H);
  const found = [];
  for (let i = 0; i < data.length; i++) {
    if (seen[i] || data[i] > 110) continue;
    const stack = [i];
    seen[i] = 1;
    let n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    while (stack.length) {
      const q = stack.pop(), x = q % W, y = (q / W) | 0;
      n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = ny * W + nx;
        if (!seen[k] && data[k] <= 110) { seen[k] = 1; stack.push(k); }
      }
    }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.hypot(cx - CX, cy - CY);
    if (n > 300 && r > 440 && r < 640 && cy < 560) found.push({ cx, cy });
  }
  // Best-fit circle through the letters' middles (least squares), so the letters can be turned exactly upright.
  const m = found.length;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sz = 0, sxz = 0, syz = 0;
  for (const { cx, cy } of found) {
    const z = cx * cx + cy * cy;
    sx += cx; sy += cy; sxx += cx * cx; syy += cy * cy; sxy += cx * cy; sz += z; sxz += cx * z; syz += cy * z;
  }
  // Solve [sxx sxy sx; sxy syy sy; sx sy m] · [a b c] = [sxz syz sz]
  const A = [[sxx, sxy, sx, sxz], [sxy, syy, sy, syz], [sx, sy, m, sz]];
  for (let i = 0; i < 3; i++) {
    const piv = A[i][i];
    for (let j = i; j < 4; j++) A[i][j] /= piv;
    for (let k = 0; k < 3; k++) if (k !== i) { const f = A[k][i]; for (let j = i; j < 4; j++) A[k][j] -= f * A[i][j]; }
  }
  CX = A[0][3] / 2;
  CY = A[1][3] / 2;
  return found
    .map(({ cx, cy }) => ({ cx, cy, angle: (Math.atan2(cx - CX, CY - cy) * 180) / Math.PI, r: Math.hypot(cx - CX, cy - CY) }))
    .sort((a, b) => a.angle - b.angle);
}

/** Greyscale picture → black ink on white (ink = anything clearly darker than the white page), then traced. */
async function ink(file, { box, keep }) {
  const { data, info } = await sharp(file).greyscale().resize({ width: Math.round(box.w * UP), height: Math.round(box.h * UP), kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const on = new Uint8Array(W * H).map((_, i) => (data[i] < 200 ? 1 : 0));
  // Connected pieces; keep only the ones the caller wants (drops neighbouring letters caught at the edge).
  const label = new Int32Array(W * H);
  const pieces = [];
  for (let i = 0; i < on.length; i++) {
    if (!on[i] || label[i]) continue;
    const id = pieces.length + 1, stack = [i];
    let minx = W, maxx = 0, miny = H, maxy = 0, n = 0;
    label[i] = id;
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p / W) | 0;
      n++; minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      for (const q of [p - 1, p + 1, p - W, p + W]) if (q >= 0 && q < on.length && on[q] && !label[q] && !((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1))) { label[q] = id; stack.push(q); }
    }
    pieces.push({ id, minx, maxx, miny, maxy, n });
  }
  const good = new Set(pieces.filter((p) => p.n > 40 * UP && keep(p, W, H)).map((p) => p.id));
  const out = Buffer.alloc(W * H, 255);
  let bb = { minx: W, maxx: 0, miny: H, maxy: 0 };
  for (let i = 0; i < out.length; i++) if (good.has(label[i])) out[i] = 0;
  for (const p of pieces) if (good.has(p.id)) bb = { minx: Math.min(bb.minx, p.minx), maxx: Math.max(bb.maxx, p.maxx), miny: Math.min(bb.miny, p.miny), maxy: Math.max(bb.maxy, p.maxy) };
  const png = await sharp(out, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  return { png, bb };
}

const trace = (png) =>
  new Promise((resolve, reject) => {
    const p = new Potrace({ turdSize: 6, alphaMax: 1, optCurve: true, optTolerance: 0.4, threshold: 128, blackOnWhite: true });
    p.loadImage(png, (err) => {
      if (err) return reject(err);
      const m = / d="([^"]+)"/.exec(p.getSVG());
      m ? resolve(m[1]) : reject(new Error("nothing traced: " + p.getSVG().slice(0, 200)));
    });
  });

const crop = (box, file, rotate, pivot = [CX, CY]) => {
  const args = [SRC, "-background", "white", "-virtual-pixel", "white"];
  if (rotate !== undefined) args.push("+distort", "SRT", `${pivot[0]},${pivot[1]} 1 ${-rotate} ${pivot[0]},${pivot[1]}`);
  args.push("-crop", `${box.w}x${box.h}+${box.x}+${box.y}`, "+repage", file);
  execFileSync("magick", args);
};

// ---- the two straight lines of lettering ----
async function line(name, box) {
  const f = path.join(TMP, `${name}.png`);
  crop(box, f);
  const { png, bb } = await ink(f, { box, keep: () => true });
  const d = await trace(png);
  return { d, x: box.x * UP, y: box.y * UP, bb };
}
const zahra = await line("zahra", { x: 190, y: 815, w: 1030, h: 180 });
const houston = await line("houston", { x: 380, y: 1010, w: 650, h: 90 });

// ---- ISLAMIC LIBRARY, letter by letter ----
const arc = await findArcLetters();
console.log("arc centre", CX.toFixed(1), CY.toFixed(1));
if (arc.length !== 14) throw new Error(`expected 14 arc letters, found ${arc.length}`);
const NAMES = "ISLAMICLIBRARY";

/** How "upright" a letter looks: the more its dark pixels line up in vertical columns (stems), the higher the number.
 *  Only the middle of the picture is looked at, so neighbouring letters hardly matter. */
async function uprightness(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const x0 = Math.round(W / 2 - 38), x1 = Math.round(W / 2 + 38);
  const cols = [];
  for (let x = x0; x < x1; x++) {
    let sum = 0;
    for (let y = Math.round(H / 2 - 45); y < Math.round(H / 2 + 45); y++) sum += data[y * W + x] < 140 ? 1 : 0;
    cols.push(sum);
  }
  const mean = cols.reduce((a, b) => a + b, 0) / cols.length;
  return cols.reduce((a, c) => a + (c - mean) ** 2, 0) / cols.length;
}

const letters = [];
for (const [i, l] of arc.entries()) {
  // A window around the letter, then try turning it a little either way (up to 6°). The letter is upright when its
  // stems line up in vertical columns. Start from the angle of its place on the arc.
  const win = path.join(TMP, `w${i}.png`);
  execFileSync("magick", [SRC, "-background", "white", "-virtual-pixel", "white", "-crop", `300x300+${Math.round(l.cx - 150)}+${Math.round(l.cy - 150)}`, "+repage", win]);
  const turned = (angle, out) => execFileSync("magick", [win, "-background", "white", "-rotate", String(-angle), "+repage", "-gravity", "center", "-crop", "200x150+0+0", "+repage", out]);
  let best = { angle: l.angle, score: Infinity };
  for (let step = -6; step <= 6; step += 1) {
    const angle = l.angle + step;
    const f = path.join(TMP, `s${i}.png`);
    turned(angle, f);
    const score = -(await uprightness(f)) + Math.abs(step) * 0.5; // a tie goes to the arc's own angle
    if (score < best.score) best = { angle, score };
  }
  const box = { w: 200, h: 150 };
  const f = path.join(TMP, `l${i}.png`);
  turned(best.angle, f);
  const { png, bb } = await ink(f, {
    box,
    keep: (p, W, H) => Math.abs((p.minx + p.maxx) / 2 - W / 2) < 40 * UP && Math.abs((p.miny + p.maxy) / 2 - H / 2) < 50 * UP,
  });
  const d = await trace(png);
  console.log(NAMES[i], "arc angle", l.angle.toFixed(1), "upright at", best.angle.toFixed(1));
  letters.push({ ch: NAMES[i], d, bb, cx: (bb.minx + bb.maxx) / 2, arcX: ((l.angle * Math.PI) / 180) * l.r * UP });
}

const num = (v) => Math.round(v * 10) / 10;
const out = `// Written by scripts/trace_lettering.mjs from public/brand/emblem.png. Do not edit by hand.
// Outlines of the emblem's own lettering (coordinates are emblem pixels × 4).
export const LETTERING_SCALE = ${UP};
export const ZAHRA = ${JSON.stringify({ d: zahra.d, x: zahra.x, y: zahra.y, minx: zahra.bb.minx, maxx: zahra.bb.maxx, miny: zahra.bb.miny, maxy: zahra.bb.maxy })};
export const HOUSTON = ${JSON.stringify({ d: houston.d, x: houston.x, y: houston.y, minx: houston.bb.minx, maxx: houston.bb.maxx, miny: houston.bb.miny, maxy: houston.bb.maxy })};
/** Each letter of ISLAMIC LIBRARY, upright. "dx" is where its middle sits along a straight line (the arc's length, unrolled); the path is in its own crop, so shift it by -cropX. */
export const LIBRARY = ${JSON.stringify(
  letters.map((l) => ({ ch: l.ch, d: l.d, dx: num(l.arcX), cx: num(l.cx), minx: l.bb.minx, maxx: l.bb.maxx, miny: l.bb.miny, maxy: l.bb.maxy })),
)};
`;
fs.writeFileSync("src/components/lettering.ts", out);
console.log("zahra", zahra.bb, "houston", houston.bb);
for (const l of letters) console.log(l.ch, l.bb, num(l.arcX));
