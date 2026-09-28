"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to `value` once `start` flips true. Renders 0 until
 * then, so server/first-client render always agree (no random/Date-based
 * state) — safe under hydration. Jumps straight to the final value under
 * prefers-reduced-motion instead of animating.
 */
export function AnimatedNumber({
  value,
  from = 0,
  start,
  durationMs = 700,
  className,
}: {
  value: number;
  /** Starting number to count up from (defaults to 0). */
  from?: number;
  start: boolean;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(from);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + eased * (value - from)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, value, from, durationMs]);

  return <span className={className}>{display}</span>;
}
