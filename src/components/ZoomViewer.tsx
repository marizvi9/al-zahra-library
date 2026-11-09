"use client";
// Full-screen, zoomable view of one cover image.
// - Phones: pinch to zoom, drag to move around, double-tap to zoom in/out.
// - Desktop: scroll wheel to zoom (towards the pointer), click to zoom in/out,
//   drag to move, or use the + / − buttons.
// - Close with the Close button, the Escape key, or by tapping outside the image.
// The large image is only downloaded when this view opens.

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  src: string;
  previewSrc: string; // already-loaded medium image, shown until the large one arrives
  alt: string;
  caption: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

const MIN = 1;
const MAX = 5;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function ZoomViewer({ open, src, previewSrc, alt, caption, onClose, onPrev, onNext }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; scale: number; moved: boolean; lastTap: number }>({
    dist: 0,
    scale: 1,
    moved: false,
    lastTap: 0,
  });

  // Reset whenever the picture changes or the view opens.
  useEffect(() => {
    setView({ scale: 1, x: 0, y: 0 });
    setLoaded(false);
  }, [src, open]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  /** Zoom to `scale`, keeping the point (cx, cy) — relative to the stage centre — still. */
  const zoomAt = useCallback((scale: number, cx = 0, cy = 0) => {
    setView((v) => {
      const s = clamp(scale, MIN, MAX);
      if (s === 1) return { scale: 1, x: 0, y: 0 };
      const k = s / v.scale;
      return { scale: s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }, []);

  const centreOffset = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { cx: clientX - (r.left + r.width / 2), cy: clientY - (r.top + r.height / 2) };
  };

  // Scroll wheel zoom (needs a non-passive listener so the page doesn't scroll).
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !open) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { cx, cy } = centreOffset(e.clientX, e.clientY);
      setView((v) => {
        const s = clamp(v.scale * Math.exp(-e.deltaY * 0.0015), MIN, MAX);
        if (s === 1) return { scale: 1, x: 0, y: 0 };
        const k = s / v.scale;
        return { scale: s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.dist = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.scale = view.scale;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, now);

    if (pointers.current.size === 2) {
      // Pinch: zoom around the midpoint of the two fingers.
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const { cx, cy } = centreOffset((a.x + b.x) / 2, (a.y + b.y) / 2);
      gesture.current.moved = true;
      zoomAt((gesture.current.scale * dist) / (gesture.current.dist || dist), cx, cy);
      return;
    }
    const dx = now.x - prev.x;
    const dy = now.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) gesture.current.moved = true;
    if (view.scale > 1) setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasPinch = pointers.current.size > 1;
    pointers.current.delete(e.pointerId);
    if (wasPinch || gesture.current.moved) return;

    // A tap or click (no dragging): toggle zoom. On touch screens, use a double-tap
    // so a single tap doesn't zoom by accident.
    const { cx, cy } = centreOffset(e.clientX, e.clientY);
    const toggle = () => (view.scale > 1 ? zoomAt(1) : zoomAt(2.5, cx, cy));
    if (e.pointerType === "mouse") return toggle();
    const t = Date.now();
    if (t - gesture.current.lastTap < 320) toggle();
    gesture.current.lastTap = t;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" && view.scale === 1) onNext?.();
    if (e.key === "ArrowLeft" && view.scale === 1) onPrev?.();
    if (e.key === "+" || e.key === "=") zoomAt(view.scale * 1.5);
    if (e.key === "-") zoomAt(view.scale / 1.5);
    if (e.key === "0") zoomAt(1);
  };

  const zoomed = view.scale > 1;

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={alt}
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {open && (
        <div
          ref={stageRef}
          className={`zoom-stage ${zoomed ? "is-zoomed" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            src={loaded ? src : previewSrc}
            alt={alt}
            className="lightbox-img"
            draggable={false}
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          />
          {/* Download the large image quietly, then swap it in. */}
          {!loaded && src !== previewSrc && (
            <img src={src} alt="" hidden onLoad={() => setLoaded(true)} />
          )}
        </div>
      )}

      <div className="lightbox-bar">
        {onPrev && (
          <button type="button" className="round-btn" onClick={onPrev} aria-label="Previous image">
            ‹
          </button>
        )}
        <span className="lightbox-caption">{caption}</span>
        {onNext && (
          <button type="button" className="round-btn" onClick={onNext} aria-label="Next image">
            ›
          </button>
        )}
        <span className="lightbox-zoom">
          <button type="button" className="round-btn" onClick={() => zoomAt(view.scale / 1.5)} aria-label="Zoom out" disabled={!zoomed}>
            −
          </button>
          <button type="button" className="round-btn" onClick={() => zoomAt(view.scale * 1.5)} aria-label="Zoom in" disabled={view.scale >= MAX}>
            +
          </button>
        </span>
        <button type="button" className="close-btn" onClick={onClose}>
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>
      <p className="lightbox-hint small">
        {zoomed ? "Drag to move around" : "Pinch, scroll or click to zoom · Esc to close"}
      </p>
    </dialog>
  );
}
