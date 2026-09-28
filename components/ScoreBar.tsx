// text-background (dark ink) reads fine on the light warning/success
// fills, but fails WCAG AA on bg-danger (#9C2B3C is too dark) — that one
// needs the light foreground text instead.
function fillColor(percent: number): { bg: string; badgeText: string } {
  if (percent < 40) return { bg: "bg-danger", badgeText: "text-foreground" };
  if (percent < 70) return { bg: "bg-warning", badgeText: "text-background" };
  return { bg: "bg-success", badgeText: "text-background" };
}

export function ScoreBar({
  label,
  value,
  max = 10,
  variant = "light",
  start = true,
  delayMs = 0,
}: {
  label: string;
  value: number;
  max?: number;
  variant?: "light" | "dark";
  /** When false, the bar sits at 0% and waits — lets a parent stagger
   * several bars instead of all animating in on mount. */
  start?: boolean;
  delayMs?: number;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const color = fillColor(percent);
  const isDark = variant === "dark";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-muted">{label}</span>
        <span
          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${color.bg} ${color.badgeText}`}
        >
          {value}/{max}
        </span>
      </div>
      <div
        className={`w-full h-4 rounded-full overflow-hidden border-2 border-border ${
          isDark ? "bg-background" : "bg-border/20"
        }`}
      >
        <div
          className={`h-full ${color.bg} rounded-full ${start ? "animate-grow-bar" : ""}`}
          style={
            {
              "--target-width": `${percent}%`,
              // The inline width is the real source of truth (correct even
              // with no animation, e.g. reduced-motion); animate-grow-bar
              // layers a CSS animation on top that overrides it in transit.
              width: start ? `${percent}%` : "0%",
              animationDelay: start ? `${delayMs}ms` : undefined,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
