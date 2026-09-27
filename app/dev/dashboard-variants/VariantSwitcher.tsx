"use client";

import { useState } from "react";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";
import type { DashboardData } from "./types";

const VARIANTS = [
  { key: "a", label: "A · Hero Boss", Component: VariantA },
  { key: "b", label: "B · Streak First", Component: VariantB },
  { key: "c", label: "C · Editorial Split", Component: VariantC },
] as const;

export function VariantSwitcher({ data }: { data: DashboardData }) {
  const [active, setActive] = useState<(typeof VARIANTS)[number]["key"]>("a");
  const current = VARIANTS.find((v) => v.key === active) ?? VARIANTS[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              onClick={() => setActive(v.key)}
              className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full border transition-colors ${
                active === v.key
                  ? "bg-accent border-accent text-foreground"
                  : "bg-transparent border-border text-muted"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <current.Component data={data} />
    </div>
  );
}
