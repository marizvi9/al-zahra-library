"use client";
// Welcome intro shown when the site first opens (once per visit).
//
// How it works:
// - The intro is part of the page's HTML, so it appears instantly with no flash.
// - A tiny script in <head> (src/lib/intro.ts) hides it straight away if it was
//   already shown in this browser tab, or if the visitor prefers reduced motion.
// - Otherwise CSS plays it (about 3 seconds) and fades it out by itself, even if
//   JavaScript fails to load: the emblem's flower draws itself and blooms upward,
//   the stars twinkle in, the letters settle into place, then it fades into the site.
// - "Skip", a click anywhere, or the Escape key ends it early.

import { useEffect } from "react";
import { Emblem } from "./Emblem";

export default function Intro() {
  useEffect(() => {
    const finish = () => document.documentElement.classList.add("intro-skipped");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => window.removeEventListener("keydown", onKey), 3800);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, []);

  const skip = () => document.documentElement.classList.add("intro-skipped");

  return (
    <div className="intro" onClick={skip}>
      <div className="intro-inner">
        <Emblem animated className="intro-emblem" title="Welcome to the Al-Zahra Islamic Library" />
      </div>
      <button type="button" className="intro-skip" onClick={skip}>
        Skip
      </button>
    </div>
  );
}
