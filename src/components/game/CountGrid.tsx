"use client";

import type { CountState } from "@shared/types/baseball-state";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export function CountGrid({ count }: { count: CountState }) {
  const { t } = useApp();

  const groups = [
    {
      label: t("balls"),
      value: count.balls,
      max: 4,
      dot: "bg-brand-blue",
      text: "text-brand-blue-ink",
    },
    {
      label: t("strikes"),
      value: count.strikes,
      max: 3,
      dot: "bg-brand-gold",
      text: "text-brand-gold-ink",
    },
    { label: t("outs"), value: count.outs, max: 3, dot: "bg-live", text: "text-live-ink" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {groups.map((group) => (
        <div key={group.label} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {group.label}
          </p>
          <p
            className={cn("font-display text-2xl font-black leading-none tabular-nums", group.text)}
          >
            {group.value}
          </p>
          <div className="mt-1.5 flex gap-1">
            {Array.from({ length: group.max }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  index < group.value
                    ? cn(group.dot, "shadow-[0_0_6px_currentColor]")
                    : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
