"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { LightningIcon } from "@/components/icons/LightningIcon";
import { CrownIcon } from "@/components/icons/CrownIcon";
import type { Milestone } from "@/lib/types";

const MILESTONE_CONTENT: Record<
  Milestone,
  {
    Icon: (props: { className?: string }) => React.JSX.Element;
    title: string;
    titleColor: string;
    subtitle: string;
    description: string;
    bossImage: string;
    bossQuote: string;
  }
> = {
  7: {
    Icon: FlameIcon,
    title: "7 Day Streak!",
    titleColor: "text-highlight",
    subtitle: "Intermediate tier unlocked",
    description:
      "You're no longer a beginner. Harder scenarios start tomorrow.",
    bossImage: "/boss/boss-impressed.png",
    bossQuote: "Hm. You actually showed up.",
  },
  14: {
    Icon: LightningIcon,
    title: "14 Day Streak!",
    titleColor: "text-accent",
    subtitle: "Advanced tier unlocked",
    description:
      "Panel interviews. Offer negotiations. The real stuff starts now.",
    bossImage: "/boss/boss-impressed.png",
    bossQuote: "I'm starting to take you seriously.",
  },
  30: {
    Icon: CrownIcon,
    title: "30 Day Streak!",
    titleColor: "text-success",
    subtitle: "Expert tier unlocked",
    description:
      "30 days. You're in the top 1% of people who actually follow through.",
    bossImage: "/boss/boss-excited.png",
    bossQuote: "FINALLY. Someone worth my time.",
  },
};

const CONFETTI_COLORS = [
  "#9C2B3C",
  "#E3B23C",
  "#7FB069",
  "#F4EEE3",
  "#7D2130",
  "#C99A2E",
];
const CONFETTI_COUNT = 20;

type ConfettiPiece = {
  left: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rounded: boolean;
};

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, () => {
    const duration = 1.4 + Math.random() * 0.8;
    return {
      left: Math.random() * 100,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration,
      // Small positive stagger so the burst doesn't launch as one flat
      // sheet, but still reads as a single moment rather than a loop.
      delay: Math.random() * 0.3,
      rounded: Math.random() > 0.5,
    };
  });
}

export function StreakCelebration({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  const [confetti] = useState(generateConfetti);
  const [reducedMotion, setReducedMotion] = useState(false);
  const content = MILESTONE_CONTENT[milestone];

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/90 flex items-center justify-center px-6 overflow-hidden"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {!reducedMotion &&
        confetti.map((piece, i) => (
          <div
            key={i}
            className="absolute top-0 pointer-events-none"
            style={{
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.rounded ? "50%" : "2px",
              animation: `confettiFall ${piece.duration}s linear ${piece.delay}s 1 forwards`,
            }}
          />
        ))}

      <div className="relative z-10 bg-foreground rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <div className="celebration-pop-1">
          <content.Icon className={`w-16 h-16 mx-auto ${content.titleColor}`} />
        </div>
        <div className="celebration-pop-2">
          <h2 className={`mt-4 font-display text-5xl font-bold ${content.titleColor}`}>
            {content.title}
          </h2>
          <p className="mt-2 text-lg font-bold text-background">
            {content.subtitle}
          </p>
          <p className="mt-4 text-muted font-medium leading-relaxed">
            {content.description}
          </p>
        </div>

        <div className="celebration-pop-3 mt-8 flex flex-col items-center gap-3">
          <Image
            src={content.bossImage}
            alt="The boss"
            width={120}
            height={120}
            className="w-[120px] h-[120px] rounded-full object-cover shadow-lg"
          />
          <div className="bg-surface border border-border rounded-xl shadow-sm px-4 py-2">
            <p className="text-sm font-bold text-foreground">
              {content.bossQuote}
            </p>
          </div>
        </div>

        <motion.button
          onClick={onDismiss}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="celebration-pop-4 mt-8 w-full bg-accent hover:bg-accent-hover text-foreground font-bold py-4 rounded-full shadow-lg transition-colors"
        >
          See my results
        </motion.button>
      </div>
    </div>
  );
}
