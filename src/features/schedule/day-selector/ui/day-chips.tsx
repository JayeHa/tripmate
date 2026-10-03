"use client";

import { useEffect, useRef } from "react";

import { dayLabel } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

type Props = {
  startDate: string;
  totalDays: number;
  value: number;
  onChange: (day: number) => void;
};

export function DayChips({ startDate, totalDays, value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>(`[data-day="${value}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [value]);

  return (
    <div
      ref={ref}
      className="flex scrollbar-none gap-2 overflow-x-auto px-4 py-2 [&::-webkit-scrollbar]:hidden"
    >
      {Array.from({ length: totalDays }, (_, i) => (
        <button
          key={i}
          type="button"
          data-day={i}
          onClick={() => onChange(i)}
          className={cn(
            "flex shrink-0 flex-col items-center rounded-xl border px-3 py-1.5 text-xs transition-colors",
            i === value
              ? "border-foreground bg-foreground text-background"
              : "bg-card text-muted-foreground active:bg-accent",
          )}
        >
          <span className="font-semibold">Day {i + 1}</span>
          <span>{dayLabel(startDate, i)}</span>
        </button>
      ))}
    </div>
  );
}
