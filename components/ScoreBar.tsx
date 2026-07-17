export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
      <div className="w-full h-2.5 bg-surface border border-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full animate-grow-bar"
          style={{ "--target-width": `${value}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
