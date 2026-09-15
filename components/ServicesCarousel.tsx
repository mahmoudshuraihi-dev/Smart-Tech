"use client";

import { useCallback, useEffect, useRef } from "react";
import ServiceCard from "./ServiceCard";
import type { ServiceCopy } from "@/lib/i18n";

const DRAG_EASE = 0.4; // tight, responsive tracking while actively dragging
const SETTLE_EASE = 0.08; // smooth glide while releasing/snapping/wheel-scrolling
const DRAG_CLICK_THRESHOLD = 6; // px of movement before a press counts as a drag, not a click
const BEND = 130; // px — how deep the arc dips at its edges
const MAX_TILT = 14; // deg — cap on how far an edge card rotates
const MIN_SCALE = 0.82; // scale of the furthest-out cards
const MAX_SCALE = 1.06; // scale of the centered card
const GAP = 28; // px between cards along the arc
const SNAP_DELAY = 120; // ms of no input before settling on the nearest card
const HOVER_Z = 999; // stacking order for whichever card is hovered, above the arc's own order

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** wraps a value into [-half, half) so the arc loops instead of stopping at an end */
function wrap(value: number, total: number) {
  const half = total / 2;
  return (((value % total) + total * 1.5) % total) - half;
}

export default function ServicesCarousel({ items }: { items: ServiceCopy[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const geometryRef = useRef({ trackWidth: 0, spacing: 340 });
  const scrollRef = useRef({ current: 0, target: 0 });
  const dragRef = useRef({ down: false, dragging: false, startX: 0, startScroll: 0, justDragged: false });
  const hoveredIndexRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const snapTimeoutRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);

  const applyPositions = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { spacing } = geometryRef.current;
    const total = items.length * spacing;
    const H = Math.max(track.clientWidth / 2, 1);
    const R = (H * H + BEND * BEND) / (2 * BEND);

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const offset = wrap(index * spacing - scrollRef.current.current, total);
      const effectiveX = Math.min(Math.abs(offset), H);
      const ratio = effectiveX / H; // 0 at center, 1 at the stage edge
      const dip = R - Math.sqrt(Math.max(R * R - effectiveX * effectiveX, 0));
      const tilt = -Math.sign(offset) * ratio * MAX_TILT;
      const scale = lerp(MAX_SCALE, MIN_SCALE, ratio);

      // prefers-reduced-motion only skips the easing between positions (handled in the
      // tick loop below) — the arc layout itself must always apply, or every card would
      // collapse onto the exact same spot and only the top one would ever be visible.
      card.style.transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${dip}px) rotate(${tilt}deg) scale(${scale})`;
      card.style.zIndex = hoveredIndexRef.current === index ? String(HOVER_Z) : String(Math.round((1 - ratio) * 100));
    });
  }, [items.length]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const firstCard = cardRefs.current[0];
    if (!track) return;
    geometryRef.current.trackWidth = track.clientWidth;
    if (firstCard) geometryRef.current.spacing = firstCard.offsetWidth + GAP;
    applyPositions();
  }, [applyPositions]);

  const wake = useCallback(() => {
    if (rafRef.current != null) return; // already running
    const tick = () => {
      const s = scrollRef.current;
      const ease = dragRef.current.dragging ? DRAG_EASE : SETTLE_EASE;
      const settled = reduceMotionRef.current || Math.abs(s.target - s.current) < 0.05;
      s.current = settled ? s.target : lerp(s.current, s.target, ease);
      applyPositions();

      if (settled && !dragRef.current.dragging) {
        rafRef.current = null; // idle — stop until something moves target again
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyPositions]);

  const scheduleSnap = useCallback(() => {
    if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    snapTimeoutRef.current = window.setTimeout(() => {
      const { spacing } = geometryRef.current;
      scrollRef.current.target = Math.round(scrollRef.current.target / spacing) * spacing;
      wake();
    }, SNAP_DELAY);
  }, [wake]);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    measure();
    wake();

    const onResize = () => {
      measure();
      wake();
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready?.then(() => {
      measure();
      wake();
    });

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
      rafRef.current = null;
    };
  }, [measure, wake]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    dragRef.current.down = true;
    dragRef.current.dragging = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScroll = scrollRef.current.target;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.down) return;
    const dx = e.clientX - dragRef.current.startX;

    if (!dragRef.current.dragging && Math.abs(dx) > DRAG_CLICK_THRESHOLD) {
      dragRef.current.dragging = true;
      try {
        trackRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // no active pointer with this id to capture — safe to ignore, the drag still
        // works for pointer movement that stays within the element's own bounds
      }
    }
    if (!dragRef.current.dragging) return;

    e.preventDefault();
    // dragging left advances forward through the deck (content follows the hand 1:1)
    scrollRef.current.target = dragRef.current.startScroll - dx;
    wake();
  };

  const endDrag = (e: React.PointerEvent) => {
    dragRef.current.down = false;
    if (dragRef.current.dragging) {
      dragRef.current.justDragged = true;
      if (trackRef.current?.hasPointerCapture(e.pointerId)) {
        trackRef.current.releasePointerCapture(e.pointerId);
      }
      scheduleSnap();
    }
    dragRef.current.dragging = false;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.justDragged) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.justDragged = false;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    // only hijack genuine horizontal gestures (trackpad swipe / shift+wheel) —
    // never steal a normal vertical page-scroll just because the cursor is over the carousel
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    scrollRef.current.target += e.deltaX;
    wake();
    scheduleSnap();
  };

  const focusCard = (index: number) => {
    scrollRef.current.target = index * geometryRef.current.spacing;
    wake();
  };

  const handleMouseEnter = (index: number) => {
    hoveredIndexRef.current = index;
    applyPositions(); // bump this card's z-index immediately, don't wait for the next tick
  };

  const handleMouseLeave = (index: number) => {
    if (hoveredIndexRef.current === index) hoveredIndexRef.current = null;
    applyPositions(); // restore its normal arc-order z-index immediately
  };

  return (
    <div
      ref={trackRef}
      className="relative h-[420px] sm:h-[470px] overflow-hidden select-none [touch-action:pan-y] cursor-grab active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
      onWheel={onWheel}
    >
      {items.map((service, index) => (
        <div
          key={service.id}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          onFocus={() => focusCard(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={() => handleMouseLeave(index)}
          className="absolute top-1/2 left-1/2 w-[240px] h-[300px] sm:w-[280px] sm:h-[320px] will-change-transform"
        >
          {/* separate inner wrapper for the hover lift, so it doesn't fight the arc
              transform above (which is rewritten every frame by JS) */}
          <div className="group relative h-full transition-transform duration-300 ease-out hover:-translate-y-3">
            <div
              aria-hidden="true"
              className="service-glow-ring pointer-events-none absolute -inset-[2px] rounded-md opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            />
            <div className="relative h-full">
              <ServiceCard service={service} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
