"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import type { CalendarCell } from "@/shared/lib/calendar";
import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";
import { MonthGrid } from "@/shared/ui/month-grid";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
/** Tailwind lg 경계. 이보다 넓으면 모바일 레이아웃은 숨겨진다 */
const WIDE = "(min-width: 1024px)";

type RangeCalendarProps = {
  months: readonly [number, number][];
  cellsOf: (year: number, month: number) => CalendarCell[];
  onPick: (date: string) => void;
  /** 처음 보일 달의 months 인덱스 */
  focusIndex: number;
};

type WeekdaysProps = { className?: string };

/** 달력 요일 머리. 일·토는 빨갛다 */
export function Weekdays({ className }: WeekdaysProps) {
  return (
    <div className={cn("grid grid-cols-7", className)}>
      {WEEKDAYS.map((label, i) => (
        <span
          key={label}
          className={cn("text-center", i === 0 || i === 6 ? "text-destructive" : "text-ink-400")}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

/** 모바일: 요일 머리 + 달을 세로로 잇고 기준 달로 스크롤해 둔다 */
export function MobileRangeCalendar({ months, cellsOf, onPick, focusIndex }: RangeCalendarProps) {
  const focusRef = useScrollIntoViewWhenVisible();
  return (
    <>
      <Weekdays className="shrink-0 border-b border-surface-muted bg-[#FAFAFB] py-2.5 text-[13px]" />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAFAFB]">
        {months.map(([year, month], i) => (
          <div
            key={`${year}-${month}`}
            ref={i === focusIndex ? focusRef : undefined}
            className="pt-5 pb-2"
          >
            <h3 className="px-5 pb-2.5 text-base font-bold text-ink-800">
              {year}년 {month}월
            </h3>
            <MonthGrid size="lg" cells={cellsOf(year, month)} onPick={onPick} />
          </div>
        ))}
      </div>
    </>
  );
}

const NAV_BUTTON = "size-8 rounded-full border border-line text-ink-700 disabled:opacity-35";

/** PC: 두 달 나란히, ◀▶ 로 넘기고 처음엔 기준 달부터 */
export function PcRangeCalendar({ months, cellsOf, onPick, focusIndex }: RangeCalendarProps) {
  const last = months.length - 2;
  const [offset, setOffset] = useState(Math.min(focusIndex, last));

  return (
    <div className="flex min-h-0 flex-1 flex-col px-7 pt-1">
      <div className="flex shrink-0 items-center gap-4 pb-2.5 text-xs text-ink-400">
        <Legend />
        <IconButton
          label="이전 달"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className={`ml-auto ${NAV_BUTTON}`}
        >
          <ChevronLeft className="size-4.5" />
        </IconButton>
        <IconButton
          label="다음 달"
          onClick={() => setOffset((o) => Math.min(last, o + 1))}
          disabled={offset === last}
          className={NAV_BUTTON}
        >
          <ChevronRight className="size-4.5" />
        </IconButton>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-8 overflow-y-auto">
        {months.slice(offset, offset + 2).map(([year, month]) => (
          <div key={`${year}-${month}`} className="flex flex-col gap-1.5">
            <h3 className="pb-1 text-center text-base font-extrabold text-ink-900">
              {year}년 {month}월
            </h3>
            <Weekdays className="pb-1.5 text-xs" />
            <MonthGrid size="md" cells={cellsOf(year, month)} onPick={onPick} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <>
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 rounded-full bg-primary" />
        출발 · 도착
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-5.5 rounded-[5px] bg-[#EEEFF1]" />
        다른 일정
      </span>
    </>
  );
}

/**
 * 붙인 요소로 스크롤한다. PC 폭에서는 모바일 달력이 숨겨져(display:none) 스크롤이 먹지 않으니,
 * 창이 좁아져(태블릿 회전) 보이게 되는 순간 다시 맞춘다.
 */
function useScrollIntoViewWhenVisible() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroll = () => ref.current?.scrollIntoView({ block: "start" });
    scroll();
    const wide = window.matchMedia(WIDE);
    const onChange = () => !wide.matches && scroll();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);
  return ref;
}
