function fillColor(percent: number): string {
  if (percent < 40) return "bg-danger";
  if (percent < 70) return "bg-warning";
  return "bg-success";
}

export function ScoreBar({
  label,
  value,
  max = 10,
  variant = "light",
}: {
  label: string;
  value: number;
  max?: number;
  variant?: "light" | "dark";
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const color = fillColor(percent);
  const isDark = variant === "dark";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-muted">{label}</span>
        <span
          className={`text-xs font-black text-background px-2.5 py-0.5 rounded-full ${color}`}
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
          className={`h-full ${color} rounded-full animate-grow-bar`}
          style={{ "--target-width": `${percent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
