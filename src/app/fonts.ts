// The site's fonts for headings, text, menus and labels, header and footer included.
// The opening animation and the emblem lettering keep IBM Plex Sans Arabic (loaded in layout.tsx),
// and Arabic, Persian and Urdu letters anywhere still use it too.
//
// Fonts are downloaded at build time and served with the site (no requests to Google).
//
// In use: option L from the font comparison page, Vollkorn + Fira Sans.
//
// ── HOW TO SWITCH TO ANOTHER PAIRING ──────────────────────────────────────────────
// Change the import and the two `export const` lines below, keeping the two `variable` names
// ("--font-content-head" and "--font-content-text"), then rebuild. Nothing else needs to change.
// If the new text font looks larger or smaller on the eye, adjust `html { font-size }` in
// globals.css (it is 100% for Fira Sans; it was 112.5% for Alegreya Sans, which runs small).
// Earlier choice, for reference (option A):
//   import { Alegreya, Alegreya_Sans } from "next/font/google";
//   export const contentHead = Alegreya({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-content-head", display: "swap" });
//   export const contentText = Alegreya_Sans({ subsets: ["latin"], weight: ["400", "500", "700", "800"], style: ["normal", "italic"], variable: "--font-content-text", display: "swap" });
// ──────────────────────────────────────────────────────────────────────────────────
import { Fira_Sans, Vollkorn } from "next/font/google";

// Vollkorn: headings. A dark, hearty book serif ("whole grain" in German) that holds up well on screens.
export const contentHead = Vollkorn({
  subsets: ["latin"], // ā ḥ ʿ etc. ("latin-ext") load by themselves where they appear
  style: ["normal", "italic"],
  variable: "--font-content-head",
  display: "swap",
});

// Fira Sans: reading text, menus, labels and buttons. A warm, open sans made for small screens.
export const contentText = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-content-text",
  display: "swap",
});
