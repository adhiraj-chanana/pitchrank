import type { nextTierProgress } from "@/lib/tiers";
import type { Mood } from "@/lib/marcusMood";
import type { PitchAttempt, Scenario } from "@/lib/types";

export type DashboardData = {
  name: string;
  currentStreak: number;
  progress: ReturnType<typeof nextTierProgress>;
  scenario: Scenario;
  mood: Mood;
  todayAttempt: PitchAttempt | null;
  recentAttempts: (PitchAttempt & { scenarios: { title: string } | null })[];
};
