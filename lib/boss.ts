import type { CSSProperties } from "react";

// The boss portraits are illustrated against a solid black backdrop baked
// into the PNG itself. Fading the edges with a mask lets the character sit
// directly on the page instead of showing a hard rectangle.
export const BOSS_IMAGE_MASK: CSSProperties = {
  maskImage:
    "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 62%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 62%)",
};

export type BossState =
  | "dismissive"
  | "interested"
  | "attentive"
  | "impressed"
  | "excited";

export const BOSS_STATE_CONFIG: Record<
  BossState,
  { image: string; borderColor: string; glow: string; label: string }
> = {
  dismissive: {
    image: "/boss/boss-dismissive.png",
    borderColor: "border-danger",
    glow: "shadow-[0_10px_40px_rgba(239,68,68,0.25)]",
    label: "dismissive",
  },
  interested: {
    image: "/boss/boss-interested.png",
    borderColor: "border-warning",
    glow: "shadow-[0_10px_40px_rgba(245,158,11,0.25)]",
    label: "interested",
  },
  attentive: {
    image: "/boss/boss-attentive.png",
    borderColor: "border-blue-500",
    glow: "shadow-[0_10px_40px_rgba(59,130,246,0.25)]",
    label: "attentive",
  },
  impressed: {
    image: "/boss/boss-impressed.png",
    borderColor: "border-purple-500",
    glow: "shadow-[0_10px_40px_rgba(168,85,247,0.25)]",
    label: "impressed",
  },
  excited: {
    image: "/boss/boss-excited.png",
    borderColor: "border-success",
    glow: "shadow-[0_10px_40px_rgba(34,197,94,0.25)]",
    label: "excited",
  },
};

export function bossStateForScore(score: number): BossState {
  if (score <= 40) return "dismissive";
  if (score <= 60) return "interested";
  if (score <= 75) return "attentive";
  if (score <= 90) return "impressed";
  return "excited";
}

// Coarser 3-bucket read of the score, used for the pulsing glow behind the
// boss portrait — distinct from the 5-state mood above.
export function glowColorForScore(score: number): string {
  if (score <= 40) return "bg-danger";
  if (score <= 75) return "bg-warning";
  return "bg-success";
}

// Used when Claude's dialogue call fails, or as a design-time preview.
export const FALLBACK_BOSS_DIALOGUE: Record<BossState, string[]> = {
  dismissive: [
    "...",
    "That was something.",
    "Come back when you know what you want to say.",
  ],
  interested: [
    "Hm.",
    "You had something there for a second.",
    "Almost. Not quite.",
  ],
  attentive: [
    "I'm listening.",
    "Decent. Not great.",
    "Work on your close. It fell apart at the end.",
  ],
  impressed: [
    "Now THAT got my attention.",
    "Sharp opener. Solid ask at the end.",
    "Send me your deck.",
  ],
  excited: [
    "FINALLY.",
    "That's exactly how you do it.",
    "I'm calling my partners right now.",
  ],
};
