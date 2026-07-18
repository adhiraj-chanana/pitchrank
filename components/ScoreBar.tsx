export function ScoreBar({
  label,
  value,
  max = 10,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-semibold text-white">
          {value}/{max}
        </span>
      </div>
      <div className="w-full h-2.5 bg-surface border border-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full animate-grow-bar"
          style={{ "--target-width": `${percent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
