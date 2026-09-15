"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Milestone } from "@/lib/types";

const MILESTONE_CONTENT: Record<
  Milestone,
  {
    emoji: string;
    title: string;
    titleColor: string;
    subtitle: string;
    description: string;
    bossImage: string;
    bossQuote: string;
  }
> = {
  7: {
    emoji: "🔥",
    title: "7 Day Streak!",
    titleColor: "text-orange-500",
    subtitle: "Intermediate tier unlocked",
    description:
      "You're no longer a beginner. Harder scenarios start tomorrow.",
    bossImage: "/boss/boss-impressed.png",
    bossQuote: "Hm. You actually showed up.",
  },
  14: {
    emoji: "⚡",
    title: "14 Day Streak!",
    titleColor: "text-[#6600FF]",
    subtitle: "Advanced tier unlocked",
    description:
      "Panel interviews. Offer negotiations. The real stuff starts now.",
    bossImage: "/boss/boss-impressed.png",
    bossQuote: "I'm starting to take you seriously.",
  },
  30: {
    emoji: "👑",
    title: "30 Day Streak!",
    titleColor: "text-yellow-500",
    subtitle: "Expert tier unlocked",
    description:
      "30 days. You're in the top 1% of people who actually follow through.",
    bossImage: "/boss/boss-excited.png",
    bossQuote: "FINALLY. Someone worth my time.",
  },
};

const CONFETTI_COLORS = [
  "#6600FF",
  "#715DF2",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#ec4899",
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
    const duration = 3 + Math.random() * 3;
    return {
      left: Math.random() * 100,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration,
      // Negative delay starts each piece already mid-fall, so the burst
      // doesn't look like it's all launching from the top at once.
      delay: -Math.random() * duration,
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
  const content = MILESTONE_CONTENT[milestone];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 overflow-hidden">
      {confetti.map((piece, i) => (
        <div
          key={i}
          className="absolute top-0 pointer-events-none"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.rounded ? "50%" : "2px",
            animation: `confettiFall ${piece.duration}s linear ${piece.delay}s infinite`,
          }}
        />
      ))}

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <span className="text-7xl">{content.emoji}</span>
        <h2 className={`mt-4 text-5xl font-black ${content.titleColor}`}>
          {content.title}
        </h2>
        <p className="mt-2 text-lg font-bold text-foreground">
          {content.subtitle}
        </p>
        <p className="mt-4 text-muted font-medium leading-relaxed">
          {content.description}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
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
          className="mt-8 w-full bg-[#6600FF] hover:bg-[#5500d6] text-white font-bold py-4 rounded-full shadow-lg transition-colors"
        >
          See my results
        </motion.button>
      </div>
    </div>
  );
}
