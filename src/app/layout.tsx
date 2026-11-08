import { ViewTransition } from "react";
import type { Metadata, Viewport } from "next";
import { Noto_Naskh_Arabic, Noto_Sans, Noto_Serif } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

// Fonts are downloaded at build time and served with the site (no tracking).
const serif = Noto_Serif({ subsets: ["latin", "latin-ext"], variable: "--font-serif", display: "swap" });
const sans = Noto_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const arabic = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Al-Zahra Library", template: "%s · Al-Zahra Library" },
  description: "Search and browse the book catalogue of the Al-Zahra Library at the Islamic Education Center.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7EE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${serif.variable} ${sans.variable} ${arabic.variable}`}>
      <body>
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
        <Footer />
      </body>
    </html>
  );
}
