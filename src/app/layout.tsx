import { ViewTransition } from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Literata } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Disclaimer from "@/components/Disclaimer";
import Intro from "@/components/Intro";
import { introScript } from "@/lib/intro";
import "./globals.css";

// Two font families, downloaded at build time and served with the site (no requests to Google,
// no layout shift; next/font sizes a matching fallback while they load):
// - Literata: headings and reading text. A serif designed for long reading on screens, with
//   full support for transliteration (ā ī ū ḥ ṣ ʿ ʾ). "opsz" lets it adjust its shapes for
//   small text and large headings.
// - IBM Plex Sans Arabic: menus, buttons and labels, and every Arabic, Persian or Urdu letter
//   anywhere on the site (it has full Arabic-script support, which Inter lacks). It also
//   draws the emblem lettering.
const serif = Literata({
  // Only basic Latin is preloaded; the files for ā ī ū ḥ ʿ etc. ("latin-ext") and others are still
  // included and load by themselves on pages that use those letters.
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-serif",
  display: "swap",
});
const sans = IBM_Plex_Sans_Arabic({
  subsets: ["latin"], // the Arabic-script file loads by itself only on pages with Arabic letters
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Al-Zahra Islamic Library", template: "%s · Al-Zahra Islamic Library" },
  description: "Search and explore the book catalog of the Al-Zahra Islamic Library at the Islamic Education Center of Houston.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ECE3CE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning /* the intro script may add a class before React loads */
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <Intro />
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          {/* Page changes fade and rise gently (in browsers that support view transitions). */}
          <ViewTransition default="page">
            <div>{children}</div>
          </ViewTransition>
        </main>
        <Disclaimer />
        <Footer />
      </body>
    </html>
  );
}
