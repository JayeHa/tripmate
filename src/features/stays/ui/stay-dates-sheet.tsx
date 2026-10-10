"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { nightsOf } from "@/entities/stay";
import { type DateSelection, pickDate } from "@/shared/lib/calendar";
import { dateRangeLabel } from "@/shared/lib/days";
import { useRangeCalendar } from "@/shared/lib/use-range-calendar";
import { cn } from "@/shared/lib/utils";
import { MobileRangeCalendar } from "@/shared/ui/range-calendar";

type StayDatesSheetProps = {
  trip: { start_date: string; end_date: string };
  checkIn: string | null;
  checkOut: string | null;
  onClose: () => void;
  onDone: (checkIn: string, checkOut: string) => void;
};

/** 안내 — 무엇을 눌러야 하는지, 다 골랐으면 기간과 박 수 */
function hintOf(sel: DateSelection): string {
  if (!sel) return "체크인 날짜를 선택해 주세요.";
  if (!sel.end) return "체크아웃 날짜를 선택해 주세요.";
  return `${dateRangeLabel(sel.start, sel.end)} · ${nightsOf({ check_in_date: sel.start, check_out_date: sel.end })}박`;
}

/**
 * 숙박 날짜 고르기 — 숙소 폼 위를 덮는 달력. 여행 기간은 파란 점으로 보이고(숙박은 기간 밖으로 나가도 된다),
 * 양 끝 라벨은 체크인 · 체크아웃. 같은 날은 체크아웃이 될 수 없다(0박 없음 — 다시 누르면 새 체크인)
 */
export function StayDatesSheet({ trip, checkIn, checkOut, onClose, onDone }: StayDatesSheetProps) {
  // 체크인만 정해져 있으면(「숙소로 등록」) 체크아웃만 고르면 되게 체크인을 잡아 둔다
  const [sel, setSel] = useState<DateSelection>(checkIn ? { start: checkIn, end: checkOut } : null);
  const calendar = useRangeCalendar({
    selection: sel,
    others: [],
    focus: checkIn ?? trip.start_date,
    marked: { start: trip.start_date, end: trip.end_date },
    labels: { start: "체크인", end: "체크아웃" },
  });
  const done = !!sel?.end;
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between pr-6 pl-5">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
          <X className="size-6" strokeWidth={2} />
        </button>
        <button
          type="button"
          disabled={!done}
          onClick={() => sel?.end && onDone(sel.start, sel.end)}
          className={cn(
            "px-0.5 py-2 text-base font-bold",
            done ? "text-brand-text" : "text-ink-350",
          )}
        >
          완료
        </button>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-divider px-5 pt-1 pb-4">
        <span className="text-2xl font-extrabold text-ink-900">숙박 날짜</span>
        <span className="text-sm text-ink-450">{hintOf(sel)}</span>
      </div>
      <MobileRangeCalendar
        {...calendar}
        onPick={(date) => setSel((prev) => pickDate(prev, date, { minNights: 1 }))}
      />
      <p className="flex shrink-0 items-center gap-1.5 border-t border-divider px-5 py-3 text-xs text-ink-400">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        여행 기간 {dateRangeLabel(trip.start_date, trip.end_date)}
      </p>
    </div>
  );
}
