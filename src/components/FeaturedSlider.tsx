"use client";
// A sliding carousel of featured books at the top of the home page.
//
// - Swipe on phones (the row scrolls and snaps one slide at a time), arrow buttons,
//   dots, or the Left/Right arrow keys while focus is inside the slider.
// - Moves on by itself every ~6.5 seconds. It waits while the mouse is over it,
//   while a finger has touched it recently, while a slide has keyboard focus, and
//   when the browser tab is hidden. A Pause button stops it for good.
// - For visitors who ask for reduced motion it never moves on its own and
//   changes slide instantly.
// - Each whole slide is one link to the book's page.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FeaturedSlide } from "@/lib/featured";
import Credit from "./Credit";

const EVERY_MS = 6500;
const SOURCE_LINKS: Record<string, string> = {
  "Google Books": "https://books.google.com",
  "Open Library": "https://openlibrary.org",
};
const TOUCH_HOLD_MS = 12000;

export default function FeaturedSlider({ slides }: { slides: FeaturedSlide[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [tick, setTick] = useState(0); // bumps to re-check later when something is holding it still
  const indexRef = useRef(0); // the slide we are on, or heading to
  const heading = useRef<number | null>(null); // set while a slide-to-slide glide is under way
  const glideTimer = useRef<number | undefined>(undefined);
  const hover = useRef(false);
  const focus = useRef(false);
  const touchUntil = useRef(0);
  const total = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const target = (i + total) % total;
      // Remember where we are heading, so quick repeat presses and the scroll
      // events fired during the glide don't confuse which slide is current.
      indexRef.current = target;
      heading.current = target;
      setIndex(target);
      window.clearTimeout(glideTimer.current);
      glideTimer.current = window.setTimeout(() => (heading.current = null), 1200);
      el.scrollTo({ left: target * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
    },
    [total, reduced],
  );

  // Work out which slide is showing, from how far the row has scrolled.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (heading.current !== null) {
      if (i === heading.current) heading.current = null; // arrived
      return; // still gliding: ignore the in-between positions
    }
    indexRef.current = i;
    setIndex(i);
  };

  // Keep the current slide in place if the window is resized (e.g. a phone turned sideways).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      el.scrollTo({ left: indexRef.current * el.clientWidth, behavior: "auto" });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Gentle auto-advance.
  useEffect(() => {
    if (!playing || reduced || total < 2) return;
    const t = window.setTimeout(() => {
      const held = hover.current || focus.current || document.hidden || Date.now() < touchUntil.current;
      if (held) setTick((n) => n + 1);
      else goTo(indexRef.current + 1);
    }, EVERY_MS);
    return () => window.clearTimeout(t);
  }, [index, playing, reduced, tick, total, goTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(indexRef.current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(indexRef.current - 1);
    }
  };

  return (
    <section
      className="slider"
      aria-roledescription="carousel"
      aria-label="Featured books"
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hover.current = true;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") hover.current = false;
      }}
      onTouchStart={() => {
        touchUntil.current = Date.now() + TOUCH_HOLD_MS;
        heading.current = null; // the visitor took over: follow their finger
      }}
      onFocus={() => (focus.current = true)}
      onBlur={() => (focus.current = false)}
    >
      <div className="slider-head">
        <h2>Featured books</h2>
        {total > 1 && !reduced && (
          <button type="button" className="slider-pause" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
            {playing ? "Pause" : "Play"}
            <span className="visually-hidden"> automatic sliding</span>
          </button>
        )}
      </div>

      <div className="slider-frame">
        {total > 1 && (
          <button type="button" className="round-btn slider-arrow slider-prev" onClick={() => goTo(indexRef.current - 1)} aria-label="Previous book">
            ‹
          </button>
        )}

        <ul
          ref={trackRef}
          className="slider-track"
          onScroll={onScroll}
          aria-live={playing && !reduced ? "off" : "polite"}
        >
          {slides.map((s, i) => (
            <li
              key={s.slug}
              className="slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
            >
              {/* The title is the link to the book, stretched over the whole slide; the author
                  names are separate links on top (see .card-link in globals.css). */}
              <div className="slide-link">
                <span className="slide-cover">
                  <img
                    src={s.cover.src}
                    alt=""
                    width={s.cover.width}
                    height={s.cover.height}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                </span>
                <span className="slide-text">
                  <span className="slide-cat">{s.category}</span>
                  <Link href={`/books/${s.slug}/`} className="slide-title card-link" dir="auto">
                    {s.title}
                  </Link>
                  <span className="slide-author" dir="auto">
                    <Credit parts={s.creditParts} />
                  </span>
                  <span className="slide-desc" dir="auto">
                    {s.description}
                  </span>
                  <span className="slide-more" aria-hidden="true">
                    View book details <span>→</span>
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>

        {total > 1 && (
          <button type="button" className="round-btn slider-arrow slider-next" onClick={() => goTo(indexRef.current + 1)} aria-label="Next book">
            ›
          </button>
        )}
      </div>

      {total > 1 && (
        <ul className="slider-dots" aria-label="Choose a book">
          {slides.map((s, i) => (
            <li key={s.slug}>
              <button
                type="button"
                className={`slider-dot ${i === index ? "is-active" : ""}`}
                aria-label={`Show book ${i + 1}: ${s.title}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="slider-credit small muted">
        Descriptions from{" "}
        {[...new Set(slides.map((s) => s.descriptionSource))].map((src, i, all) => (
          <span key={src}>
            {i > 0 ? (i === all.length - 1 ? " and " : ", ") : ""}
            <a href={SOURCE_LINKS[src] ?? "#"} target="_blank" rel="noopener noreferrer">
              {src}
            </a>
          </span>
        ))}
        .
      </p>
    </section>
  );
}
