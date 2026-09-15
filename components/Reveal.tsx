"use client";

import { useEffect, useRef, ReactNode } from "react";

export default function Reveal({
  children,
  className,
  stagger = 100,
  y = 28,
  itemSelector = ":scope > *",
}: {
  children: ReactNode;
  className?: string;
  /** delay between each item's reveal, in milliseconds */
  stagger?: number;
  /** initial vertical offset, in pixels */
  y?: number;
  itemSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = el.querySelectorAll<HTMLElement>(itemSelector);
    const targets = items.length ? Array.from(items) : [el];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    targets.forEach((target, i) => {
      target.classList.add("reveal-item");
      target.style.setProperty("--reveal-y", `${y}px`);
      target.style.transitionDelay = reduceMotion ? "0ms" : `${i * stagger}ms`;
    });

    if (reduceMotion) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            targets.forEach((target) => target.classList.add("is-visible"));
            observer.disconnect();
          }
        });
      },
      { threshold: 0.18 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [itemSelector, stagger, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
