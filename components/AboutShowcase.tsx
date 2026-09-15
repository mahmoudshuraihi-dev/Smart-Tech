"use client";

import { useEffect, useRef, useState } from "react";
import Marquee from "./Marquee";
import type { TestimonialCopy } from "@/lib/i18n";

const COLUMN_DURATIONS = ["13s", "15s", "14s", "17s"];
const COUNT_UP_DURATION_MS = 1400;

/** generic person-silhouette avatar glyph — deliberately not a photo of a real person: a
 *  stranger's real photo paired with an invented client name/role would misrepresent an
 *  actual identifiable individual as one of our clients, which we won't do regardless of
 *  the image being "fake"/found online. This keeps a photo-like avatar shape without
 *  claiming to depict anyone real. */
function AvatarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" fill="currentColor" />
      <path d="M4.5 20c1-4 4-6.5 7.5-6.5s6.5 2.5 7.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** splits "+500" / "500+" into its parts, keeping whichever affix format the locale uses */
function parseStatValue(raw: string) {
  const match = raw.match(/\d+/);
  const digits = match?.[0] ?? "0";
  const index = match?.index ?? 0;
  return {
    prefix: raw.slice(0, index),
    number: parseInt(digits, 10),
    suffix: raw.slice(index + digits.length),
  };
}

function ShowcaseCard({ item }: { item: TestimonialCopy }) {
  return (
    <div className="bg-white border border-black rounded-lg flex items-center gap-2.5 px-3 py-2.5 w-32 sm:w-36 shrink-0">
      <span
        className="flex items-center justify-center rounded-full w-7 h-7 shrink-0 text-night-foreground p-1.5"
        style={{ background: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))" }}
      >
        <AvatarGlyph className="h-full w-full" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-night truncate">{item.name}</p>
        <p className="text-[10px] text-night/60 truncate">{item.role}</p>
      </div>
    </div>
  );
}

export default function AboutShowcase({
  items,
  statValue,
  statLabel,
}: {
  items: TestimonialCopy[];
  statValue: string;
  statLabel: string;
}) {
  const { prefix, number, suffix } = parseStatValue(statValue);
  const [displayValue, setDisplayValue] = useState(0);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // deliberately does not skip under prefers-reduced-motion: this loop is small, self-contained,
    // slow, and non-parallax — the same figure is also shown statically in the stats bar below, so
    // reduced-motion users lose no information by this component still animating (same reasoning as
    // the .animate-marquee exemption in globals.css)
    const el = cellRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();

          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(eased * number));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.18 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [number]);

  const columns = [0, 1, 2, 3].map((col) => items.filter((_, i) => i % 4 === col));

  return (
    <div ref={cellRef} className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 [perspective:900px]" aria-hidden="true">
        {/* oversized (140%) and centered so that once tilted, the rotated bounding box still
            covers every corner of the cell instead of leaving bare background around it */}
        <div
          className="absolute -inset-[20%] flex flex-row gap-3"
          style={{ transform: "translateZ(-40px) rotateX(15deg) rotateY(-8deg) rotateZ(10deg)" }}
        >
          {columns.map((column, i) => (
            <Marquee
              key={i}
              vertical
              pauseOnHover
              reverse={i % 2 === 1}
              duration={COLUMN_DURATIONS[i]}
              repeat={6}
              className="h-full flex-1 min-w-0"
            >
              {column.map((item) => (
                <ShowcaseCard key={item.name} item={item} />
              ))}
            </Marquee>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4" style={{ background: "linear-gradient(to bottom, var(--night), transparent)" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4" style={{ background: "linear-gradient(to top, var(--night), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4" style={{ background: "linear-gradient(to right, var(--night), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4" style={{ background: "linear-gradient(to left, var(--night), transparent)" }} />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <p
          className="relative font-display text-5xl sm:text-6xl md:text-7xl"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--logo-blue), var(--logo-violet))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            // no backdrop shape behind the number — just a soft dark halo on the text itself so
            // it stays legible over a light card passing directly behind it, without reading as
            // "a shape sitting behind the number"
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7)) drop-shadow(0 0 14px rgba(0,0,0,0.55))",
          }}
        >
          {prefix}
          {displayValue}
          {suffix}
        </p>
        <p className="relative mt-2 text-sm text-night-foreground/70 max-w-[14rem] text-center">{statLabel}</p>
      </div>

      <span className="sr-only">
        {prefix}
        {number}
        {suffix} {statLabel}
      </span>
    </div>
  );
}
