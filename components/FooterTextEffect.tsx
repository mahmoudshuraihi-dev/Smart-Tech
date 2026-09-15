"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/** giant brand wordmark that reveals a moving logo-colored gradient wherever the
 *  cursor hovers over it, with a thin outline that draws itself in once on mount */
export default function FooterTextEffect({
  text,
  duration,
  className,
}: {
  text: string;
  duration?: number;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
    const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
    setMaskPosition({ cx: `${cxPercentage}%`, cy: `${cyPercentage}%` });
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 500 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={`select-none cursor-pointer${className ? ` ${className}` : ""}`}
    >
      <defs>
        <linearGradient id="footerTextGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
          {/* solid violet reveal — the mask below is what follows the cursor, so keeping
              this a single violet tone (instead of a left-to-right multi-color spread)
              means the patch that lights up is always violet, wherever the mouse is,
              not a different color depending on which part of the word it's over */}
          {hovered && (
            <>
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="var(--logo-violet)" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="footerRevealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="footerTextMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#footerRevealMask)" />
        </mask>
      </defs>

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent font-display text-6xl"
        style={{ stroke: "var(--night-foreground)", opacity: hovered ? 0.25 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent font-display text-6xl"
        style={{ stroke: "var(--logo-blue)" }}
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#footerTextGradient)"
        strokeWidth="0.3"
        mask="url(#footerTextMask)"
        className="fill-transparent font-display text-6xl"
      >
        {text}
      </text>
    </svg>
  );
}
