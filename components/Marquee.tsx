import type { CSSProperties, ReactNode } from "react";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  duration,
}: {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: ReactNode;
  vertical?: boolean;
  repeat?: number;
  /** overrides the 40s default, e.g. "34s" — set via inline style, not a Tailwind
   *  arbitrary-value class, since a per-instance dynamic value can't be resolved by
   *  Tailwind's static class scanner (it never sees the interpolated string at build time) */
  duration?: string;
}) {
  return (
    <div
      style={duration ? ({ "--duration": duration } as CSSProperties) : undefined}
      className={cx(
        "group flex items-center overflow-hidden [--gap:1rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={cx(
            "flex items-center shrink-0 justify-around [gap:var(--gap)]",
            vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
