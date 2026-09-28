"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades/slides content in as it scrolls into view. Server-rendered markup
 * has no hiding classes at all — it's always visible — so this only ever
 * enhances, never gates, content. On mount it checks whether the element
 * is already in the viewport (skips the hide-then-reveal for anything
 * above the fold) and bails out entirely for prefers-reduced-motion.
 *
 * `stagger` fades in direct children one after another via CSS
 * transition-delay (see .scroll-reveal-stagger in globals.css) instead of
 * all at once.
 */
export function ScrollReveal({
  children,
  className = "",
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;

    el.classList.add("scroll-reveal-pending");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.remove("scroll-reveal-pending");
        el.classList.add("scroll-reveal-visible");
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${stagger ? "scroll-reveal-stagger" : ""}`}
    >
      {children}
    </div>
  );
}
