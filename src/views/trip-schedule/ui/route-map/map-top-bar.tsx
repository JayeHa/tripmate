"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useRef } from "react";

import { dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { DialogClose, DialogTitle } from "@/shared/ui/dialog";

/** 위 칸의 그림자 — ‹ · 제목 */
const FLOAT = "bg-white shadow-[0_2px_8px_rgba(0,0,0,.14)]";

type MapTopBarProps = {
  startDate: string;
  totalDays: number;
  day: number;
  onDayChange: (day: number) => void;
};

/**
 * 동선 지도 위에 뜨는 칸 — ‹(닫기) · 「day 3 · 11.2 (월) 동선」 제목, 그 아래 날짜 칩 줄, 그 아래 범례.
 * 지도를 가리는 높이는 화면이 inset.top 으로 알고 있다
 */
export function MapTopBar({ startDate, totalDays, day, onDayChange }: MapTopBarProps) {
  const { date, dow } = dayParts(startDate, day);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2.5 pt-[max(env(safe-area-inset-top),0.75rem)]">
      <div className="flex items-center gap-2 px-4">
        <DialogClose
          aria-label="일정으로 돌아가기"
          className={cn(
            "pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full text-ink-900",
            FLOAT,
          )}
        >
          <ChevronLeft className="size-5.5" />
        </DialogClose>
        <DialogTitle
          className={cn(
            "pointer-events-auto flex h-10 min-w-0 flex-1 items-center gap-1.5 truncate rounded-full px-3.5 text-sm font-extrabold text-[#111]",
            FLOAT,
          )}
        >
          <span className="text-route-stop">
            day {day + 1} · {date} ({dow})
          </span>
          동선
        </DialogTitle>
      </div>
      <MapDayChips totalDays={totalDays} day={day} onDayChange={onDayChange} />
      <div className="mx-4 flex w-max gap-3 rounded-memo bg-white/92 px-2.5 py-1.75 text-[11px] font-bold text-ink-700 shadow-[0_1px_4px_rgba(0,0,0,.1)]">
        <span className="flex items-center gap-1.25">
          <span aria-hidden="true" className="h-1 w-4.5 rounded-full bg-route-stop" />
          전철·버스
        </span>
        <span className="flex items-center gap-1.25">
          <span aria-hidden="true" className="w-4.5 border-t-3 border-dotted border-[#7D8590]" />
          도보
        </span>
      </div>
    </div>
  );
}

type MapDayChipsProps = Omit<MapTopBarProps, "startDate">;

/** 지도 위 날짜 칩 「day 1」(흰 바탕 · 고른 날 잉크). 고른 칩이 보이게 칩 줄만 가로로 스크롤한다 */
function MapDayChips({ totalDays, day, onDayChange }: MapDayChipsProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = ref.current;
    const chip = row?.querySelector<HTMLElement>(`[data-day="${day}"]`);
    if (!row || !chip) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2 });
  }, [day]);
  return (
    <div
      ref={ref}
      className="pointer-events-auto relative flex gap-1.5 overflow-x-auto px-4 py-1 [&::-webkit-scrollbar]:hidden"
    >
      {Array.from({ length: totalDays }, (_, i) => (
        <button
          key={i}
          type="button"
          data-day={i}
          aria-pressed={i === day}
          onClick={() => onDayChange(i)}
          className={cn(
            "flex h-7.5 shrink-0 items-center rounded-full px-3 text-xs font-bold shadow-[0_1px_4px_rgba(0,0,0,.12)]",
            i === day ? "bg-[#111] text-white" : "bg-white text-ink-700",
          )}
        >
          day {i + 1}
        </button>
      ))}
    </div>
  );
}
