import type { Tier } from "./types";

export const TIER_THRESHOLDS: { tier: Tier; streak: number }[] = [
  { tier: "expert", streak: 30 },
  { tier: "advanced", streak: 14 },
  { tier: "intermediate", streak: 7 },
  { tier: "beginner", streak: 0 },
];

export function tierForStreak(streak: number): Tier {
  const match = TIER_THRESHOLDS.find((t) => streak >= t.streak);
  return match ? match.tier : "beginner";
}

export function nextTierProgress(streak: number): {
  currentTier: Tier;
  nextTier: Tier | null;
  streakForNextTier: number | null;
  streaksRemaining: number | null;
} {
  const currentTier = tierForStreak(streak);
  const ascending = [...TIER_THRESHOLDS].reverse(); // beginner -> expert
  const currentIndex = ascending.findIndex((t) => t.tier === currentTier);
  const next = ascending[currentIndex + 1] ?? null;

  return {
    currentTier,
    nextTier: next ? next.tier : null,
    streakForNextTier: next ? next.streak : null,
    streaksRemaining: next ? Math.max(next.streak - streak, 0) : null,
  };
}

export const TIER_LABELS: Record<Tier, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export function streakProgressMessage(streak: number): string {
  if (streak < 7) return "Keep going — Intermediate unlocks at day 7";
  if (streak < 14) return "Intermediate unlocked! Advanced at day 14";
  if (streak < 30) return "Advanced unlocked! Expert at day 30";
  return "Expert tier. You're in rare company.";
}
