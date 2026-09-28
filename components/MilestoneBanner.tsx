"use client";

import { useEffect, useState } from "react";

export function MilestoneBanner({
  tierLabel,
  storageKey,
}: {
  tierLabel: string;
  storageKey: string;
}) {
  // Default to hidden so there's no flash-of-banner-then-hide once we check
  // localStorage — a brief pop-in if it turns out to be undismissed reads
  // better than a pop-out if it was already dismissed.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  return (
    <div className="bg-accent px-6 py-3 flex items-center justify-center gap-4">
      <p className="text-foreground font-bold text-sm text-center">
        🎉 You unlocked {tierLabel} tier today!
      </p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 -m-3.5 p-3.5 text-muted hover:text-foreground font-black text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
