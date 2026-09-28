"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

/**
 * The streak digit plus the "Day N streak saved" toast, played together
 * as one moment right after a user completes today's pitch. `justCompleted`
 * comes from a `?justCompleted=1` query param set by the results page's
 * "Back to Dashboard" link — server-derived, so it's identical on the
 * server render and the first client render (no hydration mismatch).
 */
export function StreakMoment({
  streak,
  justCompleted,
  className,
}: {
  streak: number;
  justCompleted: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!justCompleted) return;
    toast.success(`Day ${streak} streak saved`);

    // Drop the query param so refreshing or hitting back doesn't replay
    // the toast/count-up on every visit.
    const url = new URL(window.location.href);
    url.searchParams.delete("justCompleted");
    window.history.replaceState({}, "", url.toString());
  }, [justCompleted, streak]);

  return (
    <AnimatedNumber
      value={streak}
      from={justCompleted ? Math.max(0, streak - 1) : streak}
      start={justCompleted}
      durationMs={600}
      className={className}
    />
  );
}
