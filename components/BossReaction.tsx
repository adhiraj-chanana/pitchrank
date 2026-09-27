"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  BOSS_IMAGE_MASK,
  BOSS_STATE_CONFIG,
  FALLBACK_BOSS_DIALOGUE,
  bossStateForScore,
  glowColorForScore,
} from "@/lib/boss";

const CHAR_DELAY_MS = 40;
const IMAGE_FADE_MS = 600;
const FIRST_LINE_DELAY_MS = 800;
const LINE_PAUSE_MS = 600;
const REACT_SHAKE_MS = 600;

const LINE_STYLES = [
  "text-sm text-muted italic font-medium",
  "text-lg text-foreground font-bold",
  "text-2xl font-black text-foreground",
];

const HOVER_QUOTES = [
  "Still here?",
  "I'm watching you.",
  "Don't waste my time.",
  "You think that was good?",
  "I've seen better.",
];

function TypewriterLine({
  text,
  started,
  className,
  onDone,
}: {
  text: string;
  started: boolean;
  className: string;
  onDone: () => void;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCount(i);
      if (i >= text.length) {
        clearInterval(interval);
        onDone();
      }
    }, CHAR_DELAY_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Reserve the line's final height (invisible) so later lines don't jump
  // the layout as they type in.
  if (!started) {
    return <p className={`${className} invisible`}>{text}</p>;
  }

  return <p className={className}>{text.slice(0, count)}</p>;
}

export function BossReaction({
  score,
  feedback,
  dialogue,
  onSequenceComplete,
}: {
  score: number;
  feedback: string[];
  dialogue?: string[];
  onSequenceComplete?: () => void;
}) {
  const state = bossStateForScore(score);
  const config = BOSS_STATE_CONFIG[state];
  const glowColor = glowColorForScore(score);
  const lines =
    dialogue && dialogue.length === 3 ? dialogue : FALLBACK_BOSS_DIALOGUE[state];

  const [imageIn, setImageIn] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [dialogueDone, setDialogueDone] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverQuote, setHoverQuote] = useState("");
  const completedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setImageIn(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!imageIn) return;
    const t = setTimeout(() => setActiveLine(0), FIRST_LINE_DELAY_MS);
    return () => clearTimeout(t);
  }, [imageIn]);

  function handleLineDone(index: number) {
    if (index < lines.length - 1) {
      setTimeout(() => setActiveLine(index + 1), LINE_PAUSE_MS);
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;

    setDialogueDone(true);
    setIsReacting(true);
    setTimeout(() => setIsReacting(false), REACT_SHAKE_MS);

    onSequenceComplete?.();
  }

  // Hover is a post-verdict flourish — it shouldn't cut into the typewriter
  // sequence, so it's a no-op until the dialogue has finished. Gated to
  // pointerType "mouse" so a tap on touch devices doesn't trigger it and
  // get stuck on (no real pointerleave follows a tap).
  function handlePointerEnter(e: React.PointerEvent) {
    if (!dialogueDone || e.pointerType !== "mouse") return;
    setHoverQuote(HOVER_QUOTES[Math.floor(Math.random() * HOVER_QUOTES.length)]);
    setIsHovered(true);
  }

  function handlePointerLeave(e: React.PointerEvent) {
    if (!dialogueDone || e.pointerType !== "mouse") return;
    setIsHovered(false);
  }

  const showingHoverImage = dialogueDone && isHovered;
  const imageSrc = showingHoverImage ? "/boss/boss-attentive.png" : config.image;
  const imageAlt = showingHoverImage
    ? "The boss, now looking straight at you"
    : `The boss looking ${config.label}`;
  const imageAnimClass = !imageIn
    ? ""
    : isReacting
    ? "animate-boss-react"
    : "animate-boss-float";

  return (
    <div
      className={`bg-surface border-[3px] ${config.borderColor} ${config.glow} shadow-lg rounded-3xl p-8 mb-6 flex flex-col items-center gap-6`}
    >
      <div
        className="relative mx-auto w-full"
        style={{
          maxWidth: 340,
          opacity: imageIn ? 1 : 0,
          transform: imageIn ? "scale(1)" : "scale(0.8)",
          transition: `opacity ${IMAGE_FADE_MS}ms ease-out, transform ${IMAGE_FADE_MS}ms ease-out`,
        }}
      >
        <div
          className={`absolute inset-6 rounded-full blur-2xl animate-glow-pulse z-0 ${glowColor}`}
        />

        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-foreground rounded-xl shadow-lg px-4 py-2 whitespace-nowrap"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: "opacity 200ms ease-out",
            pointerEvents: "none",
          }}
        >
          <p className="text-xs font-bold text-background">{hoverQuote}</p>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rotate-45" />
        </div>

        <Image
          src={imageSrc}
          alt={imageAlt}
          width={300}
          height={300}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          className={`relative z-10 w-full h-auto rounded-2xl ${imageAnimClass}`}
          style={BOSS_IMAGE_MASK}
          priority
        />
      </div>

      <div className="w-full flex flex-col items-center gap-3 text-center">
        {feedback.length > 0 && (
          <span className="sr-only">Feedback: {feedback.join(" ")}</span>
        )}
        {lines.map((line, i) => (
          <TypewriterLine
            key={i}
            text={line}
            started={activeLine >= i}
            className={LINE_STYLES[i] ?? LINE_STYLES[LINE_STYLES.length - 1]}
            onDone={() => handleLineDone(i)}
          />
        ))}
      </div>
    </div>
  );
}
