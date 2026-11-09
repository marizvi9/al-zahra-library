"use client";
// Welcome intro shown when the site first opens (once per visit).
//
// How it works:
// - The intro is part of the page's HTML, so it appears instantly with no flash.
// - A tiny script in <head> (src/lib/intro.ts) hides it straight away if it was
//   already shown in this browser tab, or if the visitor prefers reduced motion.
// - Otherwise CSS plays it for about 2.5 seconds and fades it out by itself
//   (this works even if JavaScript fails to load).
// - "Skip", a click anywhere, or the Escape key ends it early.
//
// Logo files (replace with the real ones, keeping the same names):
//   public/logos/al-zahra-logo.svg   and   public/logos/iec-logo.svg

import { useEffect } from "react";
import { withBase } from "@/lib/paths";

export default function Intro() {
  useEffect(() => {
    const finish = () => document.documentElement.classList.add("intro-skipped");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => window.removeEventListener("keydown", onKey), 3500);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, []);

  const skip = () => document.documentElement.classList.add("intro-skipped");

  return (
    <div className="intro" onClick={skip}>
      <div className="intro-inner">
        <div className="intro-logos">
          <img src={withBase("/logos/al-zahra-logo.svg")} alt="Al-Zahra Library logo" width={120} height={120} />
          <img src={withBase("/logos/iec-logo.svg")} alt="Islamic Education Center logo" width={120} height={120} />
        </div>
        <p className="intro-text">Welcome to the Al-Zahra Library at IEC</p>
      </div>
      <button type="button" className="intro-skip" onClick={skip}>
        Skip
      </button>
    </div>
  );
}
