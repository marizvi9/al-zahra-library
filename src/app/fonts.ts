// The site's fonts for headings, text, menus and labels, header and footer included.
// The opening animation and the emblem lettering keep IBM Plex Sans Arabic (loaded in layout.tsx),
// and Arabic, Persian and Urdu letters anywhere still use it too.
//
// Fonts are downloaded at build time and served with the site (no requests to Google).
//
// ── HOW TO SWITCH TO ANOTHER PAIRING ──────────────────────────────────────────────
// Replace the two `export const` lines below with the lines of option B or C, change the import
// on the first line to match, then rebuild. Nothing else needs to change.
//
// Option A (in use): Alegreya + Alegreya Sans
//   import { Alegreya, Alegreya_Sans } from "next/font/google";
//   (the code below)
//
// Option B: Libre Caslon Text + Libre Franklin
//   import { Libre_Caslon_Text, Libre_Franklin } from "next/font/google";
//   export const contentHead = Libre_Caslon_Text({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-content-head", display: "swap" });
//   export const contentText = Libre_Franklin({ subsets: ["latin"], variable: "--font-content-text", display: "swap" });
//
// Option C: Spectral + Hind
//   import { Spectral, Hind } from "next/font/google";
//   export const contentHead = Spectral({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-content-head", display: "swap" });
//   export const contentText = Hind({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-content-text", display: "swap" });
// ──────────────────────────────────────────────────────────────────────────────────
import { Alegreya, Alegreya_Sans } from "next/font/google";

// Alegreya: headings. A book typeface made for literature, with a calligraphic, pen-made rhythm.
export const contentHead = Alegreya({
  subsets: ["latin"], // ā ḥ ʿ etc. ("latin-ext") load by themselves where they appear
  style: ["normal", "italic"],
  variable: "--font-content-head",
  display: "swap",
});

// Alegreya Sans: reading text, labels and buttons. The same designer's humanist sans, so the two match.
export const contentText = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-content-text",
  display: "swap",
});
