"use client";

import { useEffect, useRef } from "react";

import { dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

type Props = {
  startDate: string;
  totalDays: number;
  value: number;
  onChange: (day: number) => void;
};

/** 날짜 칩 줄 「day 1 10.31」. 32px 알약, 선택은 잉크색. 고른 칩이 가운데로 오게 스크롤한다 */
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
      className="flex scrollbar-none gap-2 overflow-x-auto border-b border-divider bg-white px-5 pt-0.5 pb-2.5 [&::-webkit-scrollbar]:hidden"
    >
      {Array.from({ length: totalDays }, (_, i) => (
        <button
          key={i}
          type="button"
          data-day={i}
          aria-pressed={i === value}
          onClick={() => onChange(i)}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.25 rounded-2xl px-3.25 text-[13px] font-bold",
            i === value ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-600",
          )}
        >
          day {i + 1}
          <span className="font-medium opacity-75">{dayParts(startDate, i).date}</span>
        </button>
      ))}
    </div>
  );
}
