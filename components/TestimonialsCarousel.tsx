"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useI18n, type TestimonialCopy } from "@/lib/i18n";

// Spring physics for the ring rotation — lower stiffness + a touch more damping
// than a snappy UI spring so it glides into place instead of snapping (disabled
// in favor of an instant transition when the user prefers reduced motion)
const springTransition = {
  type: "spring",
  stiffness: 38,
  damping: 16,
  mass: 1,
} as const;

// How often the ring auto-advances (slower than a photo carousel — a quote
// takes longer to read than a glance at an image)
const AUTOPLAY_INTERVAL_MS = 5000;

// Ring depth (radius) bounds and how much of the container width it uses —
// large enough that the side cards clear the center card with a visible gap
// instead of tucking behind/against it
const RADIUS_MIN = 160;
const RADIUS_MAX = 520;
const RADIUS_WIDTH_RATIO = 0.55;
const PERSPECTIVE_MULTIPLIER = 2.4;
const RING_TILT_DEG = 26;

// Center card crossfade
const CROSSFADE_DURATION_S = 0.55;
const CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;

// the ring is built from small versions of the same card, not bare avatar dots —
// so it actually reads as "cards in a ring", matching the center card's shape.
// Kept small (and the radius above generous) so that even the most-compressed
// cards — the ones furthest around the ring, near the back seam where the
// projection naturally bunches them — still clear each other with a gap.
const RING_CARD_SIZE_CLASSES = "w-10 h-14 sm:w-11 sm:h-[60px] md:w-12 md:h-16";
const RING_AVATAR_SIZE_CLASSES = "w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6";
const CENTER_CARD_SIZE_CLASSES = "w-[220px] sm:w-[300px] md:w-[360px] min-h-[200px] sm:min-h-[230px]";
const BUTTON_SIZE_CLASSES = "w-10 h-10 sm:w-11 sm:h-11";

/** first letter of the first word + first letter of the last word — works for Arabic and Latin names alike */
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function TestimonialsCarousel({ items }: { items: TestimonialCopy[] }) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [radius, setRadius] = useState(160);
  const reduceMotion = useReducedMotion();

  const numImages = items.length || 1;
  const angleStep = 360 / numImages;

  const steps = Math.round(rotation / angleStep);
  const centerIndex = ((-steps % numImages) + numImages) % numImages;
  const centerItem = items[centerIndex];

  useEffect(() => {
    const updateRadius = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      setRadius(Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, width * RADIUS_WIDTH_RATIO)));
    };
    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  useEffect(() => {
    // an auto-rotating ring is exactly the kind of motion prefers-reduced-motion
    // asks us to avoid — leave it fully manual (arrows still work) in that case
    if (reduceMotion) return;
    const interval = setInterval(() => setRotation((prev) => prev + angleStep), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [angleStep, reduceMotion]);

  const rotateCarousel = useCallback(
    (direction: "left" | "right") => {
      setRotation((prev) => prev + (direction === "left" ? -angleStep : angleStep));
    },
    [angleStep],
  );

  const ringTransition = reduceMotion ? { duration: 0 } : springTransition;
  const crossfadeTransition = reduceMotion
    ? { duration: 0 }
    : { duration: CROSSFADE_DURATION_S, ease: CROSSFADE_EASE };

  if (!centerItem) return null;

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl mx-auto h-[210px] sm:h-[240px] md:h-[260px] flex items-center justify-center"
      >
        <div className="testimonial-ring-glow" aria-hidden="true" />
        <div className="relative w-full h-full" style={{ perspective: radius * PERSPECTIVE_MULTIPLIER }}>
          {items.map((item, index) => {
            const targetAngle = rotation + angleStep * index;
            // sibling motion.divs don't get correctly depth-sorted by the browser on their
            // own (each one's transform-style: preserve-3d only governs ITS OWN children,
            // and framer-motion's automatic will-change often forces siblings into separate
            // stacking contexts) — so paint order falls back to DOM order and cards can cover
            // ones that should be in front of them. Fix: derive z-index from the same cosine
            // that drives depth (z: radius below), so whichever card actually faces the
            // camera always paints on top, exactly matching its real 3D position.
            const depth = Math.round(Math.cos((targetAngle * Math.PI) / 180) * 100);
            // fade cards as they recede toward the back of the ring — mainly so the couple
            // of cards nearest the back "seam" (where the projection naturally brings
            // angularly-adjacent cards closest together on screen) dim into each other
            // instead of two fully-opaque cards visibly clashing there
            const opacity = 0.4 + 0.6 * ((depth / 100 + 1) / 2);
            return (
              <motion.div
                key={item.name}
                className="absolute inset-0 flex items-center justify-center"
                style={{ transformStyle: "preserve-3d", zIndex: depth }}
                animate={{ rotateY: targetAngle }}
                transition={ringTransition}
              >
                <motion.div
                  className="relative"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: -targetAngle, rotateX: RING_TILT_DEG, z: radius, opacity }}
                  transition={ringTransition}
                >
                  <div
                    title={item.name}
                    className={`card rounded-xl flex flex-col items-center justify-center gap-1.5 px-2 py-3 shadow-[0_6px_20px_rgba(0,0,0,0.12)] ${RING_CARD_SIZE_CLASSES}`}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full text-night-foreground font-display text-xs sm:text-sm ${RING_AVATAR_SIZE_CLASSES}`}
                      style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
                    >
                      {getInitials(item.name)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-ink font-semibold text-center leading-tight line-clamp-2">
                      {item.name}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-[200] pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={centerItem.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={crossfadeTransition}
              className="pointer-events-auto"
            >
              <figure className={`card rounded-2xl px-6 py-6 sm:px-8 sm:py-7 flex flex-col ${CENTER_CARD_SIZE_CLASSES}`}>
                <blockquote className="font-display text-base sm:text-lg leading-snug flex-1 line-clamp-5">
                  &ldquo;{centerItem.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5">
                  <p className="text-sm font-semibold text-ink">{centerItem.name}</p>
                  <p className="text-xs text-muted mt-0.5">{centerItem.role}</p>
                </figcaption>
              </figure>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 sm:mt-8 z-[210]">
        <button
          type="button"
          aria-label={t.a11y.previousTestimonial}
          onClick={() => rotateCarousel("left")}
          className={`flex items-center justify-center ${BUTTON_SIZE_CLASSES} rounded-full border border-line bg-paper-raised text-muted hover:text-mark hover:border-mark/50 transition-colors duration-200 active:scale-90 cursor-pointer`}
        >
          <FaArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={t.a11y.nextTestimonial}
          onClick={() => rotateCarousel("right")}
          className={`flex items-center justify-center ${BUTTON_SIZE_CLASSES} rounded-full border border-line bg-paper-raised text-muted hover:text-mark hover:border-mark/50 transition-colors duration-200 active:scale-90 cursor-pointer`}
        >
          <FaArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
