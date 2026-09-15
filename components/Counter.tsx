"use client";

import { useEffect, useRef, useState } from "react";

const COUNT_UP_DURATION_MS = 1400;

/** splits "+500" / "500+" / "97%" into its parts, keeping whichever affix format is used */
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

/** counts up from 0 to the number embedded in `value` once scrolled into view, keeping any
 *  prefix/suffix (e.g. "+" before the digits in Arabic, "+"/"%" after in English) intact */
export default function Counter({ value }: { value: string }) {
  const { prefix, number, suffix } = parseStatValue(value);
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
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

  return (
    <span ref={ref}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
