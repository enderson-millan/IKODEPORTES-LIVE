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
      text: "text-brand-blue",
    },
    {
      label: t("strikes"),
      value: count.strikes,
      max: 3,
      dot: "bg-brand-gold",
      text: "text-brand-gold",
    },
    { label: t("outs"), value: count.outs, max: 3, dot: "bg-live", text: "text-live" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {groups.map((group) => (
        <div key={group.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {group.label}
          </p>
          <p className={cn("font-display text-3xl font-black tabular-nums", group.text)}>
            {group.value}
          </p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: group.max }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 w-full rounded-full",
                  index < group.value ? group.dot : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
