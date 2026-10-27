"use client";

import { useEffect, useRef } from "react";

import { dateTone, dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

/** 날짜 글자색 — 토 파랑 · 일 · 공휴일 빨강(가계부 날짜 줄과 같은 색) */
const DATE_TONE = { sat: "text-brand", sun: "text-destructive" } as const;

type Props = {
  startDate: string;
  totalDays: number;
  value: number;
  onChange: (day: number) => void;
  /** 그 날의 여행지 공휴일 이름 — 있으면 칩의 날짜를 빨갛게(이름은 화면 읽기 프로그램용). 없으면 칠하지 않는다 */
  holidayOf?: (day: number) => string | null;
};

/**
 * 날짜 칩 줄 「day 1 10.31」. 32px 알약, 선택은 잉크색. 날짜는 토요일 파랑 · 일요일 · 여행지 공휴일 빨강. 고른 칩이 가운데로 오게 칩 줄만 가로로 스크롤한다 —
 * scrollIntoView 는 페이지까지 스크롤해서, 칩을 눌러 그 날짜로 가는 페이지의 smooth 스크롤을 끊는다.
 * 칩 줄이 `relative` 라 칩의 offsetLeft 는 칩 줄 기준이다
 */
export function DayChips({ startDate, totalDays, value, onChange, holidayOf }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = ref.current;
    const chip = row?.querySelector<HTMLElement>(`[data-day="${value}"]`);
    if (!row || !chip) return;
    row.scrollTo({
      left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [value]);

  return (
    <div
      ref={ref}
      className="relative flex scrollbar-none gap-2 overflow-x-auto border-b border-divider bg-white px-5 pt-0.5 pb-2.5 [&::-webkit-scrollbar]:hidden"
    >
      {Array.from({ length: totalDays }, (_, i) => {
        const holiday = holidayOf?.(i) ?? null;
        const tone = dateTone(startDate, i, !!holiday);
        return (
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
            <span
              title={holiday ?? undefined}
              className={cn("font-medium", tone ? DATE_TONE[tone] : "opacity-75")}
            >
              {dayParts(startDate, i).date}
            </span>
            {holiday && <span className="sr-only">{holiday}</span>}
          </button>
        );
      })}
    </div>
  );
}
