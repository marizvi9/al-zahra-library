"use client";
// The cover viewer on each book page.
// - Turns between images with a gentle 3D "flip the book over" animation.
// - Swipe on phones, arrow keys on keyboards, or tap the thumbnails.
// - Tap the cover to open a larger, zoomable view (see ZoomViewer.tsx).
// Animations are switched off for visitors who ask for reduced motion.

import { useCallback, useRef, useState, ViewTransition } from "react";
import ArchCover from "./ArchCover";
import ZoomViewer from "./ZoomViewer";
import type { CoverImage } from "@/lib/catalog";

type Props = {
  slug: string;
  title: string;
  images: CoverImage[];
  source?: { name: string; url: string };
};

// Neutral captions: Open Library doesn't say which image is front, back or title page.
const labelFor = (images: CoverImage[], i: number) =>
  images.length > 1 ? `Image ${i + 1} of ${images.length}` : "Cover image";

export default function CoverGallery({ slug, title, images, source }: Props) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<{ index: number; dir: 1 | -1 } | null>(null);
  const [turnDir, setTurnDir] = useState<1 | -1 | null>(null); // direction of the last turn
  const [zoomed, setZoomed] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const total = images.length;

  const go = useCallback(
    (next: number) => {
      if (total < 2) return;
      const target = (next + total) % total;
      if (target === index) return;
      const dir: 1 | -1 = next > index ? 1 : -1;
      setLeaving({ index, dir });
      setTurnDir(dir);
      setIndex(target);
    },
    [index, total],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  };
  const onPointerDown = (e: React.PointerEvent) => (swipeStart.current = e.clientX);
  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    else setZoomed(true);
  };

  if (total === 0) {
    return (
      <div className="gallery">
        <ViewTransition name={`cover-${slug}`} share="morph" default="none">
          <div>
            <ArchCover title={title} />
          </div>
        </ViewTransition>
        <p className="gallery-caption muted small">No cover image yet</p>
      </div>
    );
  }

  const first = images[0];
  const dir = leaving?.dir ?? 1;

  return (
    <div className="gallery">
      <ViewTransition name={`cover-${slug}`} share="morph" default="none">
        <div
          className="gallery-stage book-3d"
          style={{ aspectRatio: `${first.width} / ${first.height}` }}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={`Cover images for ${title}. ${total > 1 ? "Use the arrow keys to turn. " : ""}Press Enter to enlarge.`}
          onKeyDown={(e) => {
            onKey(e);
            if (e.key === "Enter") setZoomed(true);
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {leaving && (
            <img
              key={`out-${leaving.index}`}
              src={images[leaving.index].src}
              alt=""
              className={`gallery-img turn-out ${dir > 0 ? "to-left" : "to-right"}`}
              onAnimationEnd={() => setLeaving(null)}
              draggable={false}
            />
          )}
          <img
            key={`in-${index}`}
            src={images[index].src}
            alt={`${labelFor(images, index)}: ${title}`}
            width={images[index].width}
            height={images[index].height}
            className={`gallery-img ${turnDir ? `turn-in ${turnDir > 0 ? "from-right" : "from-left"}` : "fade-in"}`}
            draggable={false}
          />
        </div>
      </ViewTransition>

      <p className="gallery-caption" aria-live="polite">
        {labelFor(images, index)}
      </p>

      {total > 1 && (
        <div className="gallery-controls">
          <button type="button" className="round-btn" onClick={() => go(index - 1)} aria-label="Previous image">
            ‹
          </button>
          <ul className="gallery-thumbs">
            {images.map((img, i) => (
              <li key={img.src}>
                <button
                  type="button"
                  className={`thumb ${i === index ? "is-active" : ""}`}
                  aria-label={labelFor(images, i)}
                  aria-current={i === index}
                  onClick={() => go(i)}
                >
                  <img src={img.thumb ?? img.src} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="round-btn" onClick={() => go(index + 1)} aria-label="Next image">
            ›
          </button>
        </div>
      )}

      {source && (
        <p className="gallery-source small muted">
          Cover from <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>
        </p>
      )}

      <ZoomViewer
        open={zoomed}
        src={images[index].large ?? images[index].src}
        previewSrc={images[index].src}
        alt={`${labelFor(images, index)}: ${title}`}
        caption={labelFor(images, index)}
        onClose={() => setZoomed(false)}
        onPrev={total > 1 ? () => go(index - 1) : undefined}
        onNext={total > 1 ? () => go(index + 1) : undefined}
      />
    </div>
  );
}
