import { ViewTransition } from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Disclaimer from "@/components/Disclaimer";
import Intro from "@/components/Intro";
import { introScript } from "@/lib/intro";
import { contentHead, contentText } from "./fonts";
import "./globals.css";

// Headings, text, menus and labels use the pair set in ./fonts.ts.
// IBM Plex Sans Arabic draws the emblem lettering and the opening animation, and every Arabic,
// Persian or Urdu letter anywhere on the site (it has full Arabic-script support).
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
      // Smooth scrolling is on for links within a page (globals.css). This tells Next.js to jump
      // straight to the top when moving to a new page, instead of opening it at the old scroll
      // position and gliding up (which briefly showed the bottom of the new page).
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${contentHead.variable} ${contentText.variable}`}
      suppressHydrationWarning /* the intro script may add a class before React loads */
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript(sans.style.fontFamily) }} />
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
