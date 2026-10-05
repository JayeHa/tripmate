import { ChevronLeft, ChevronRight } from "lucide-react";

type DayPagerProps = {
  day: number;
  totalDays: number;
  onChange: (day: number) => void;
};

/** 하루씩 보기의 목록 끝 — 왼쪽 「‹ day N」(외곽선) · 오른쪽 「다음 날 · day N ›」(잉크). 첫날 · 마지막 날은 한쪽만 */
export function DayPager({ day, totalDays, onChange }: DayPagerProps) {
  return (
    <nav aria-label="날짜 넘기기" className="flex justify-between gap-2.5 px-7 pt-5 pb-24">
      {day > 0 && (
        <button
          type="button"
          onClick={() => onChange(day - 1)}
          className="flex h-11 items-center gap-1 rounded-button border border-line-strong pr-4 pl-2.5 text-sm font-bold text-ink-700 hover:bg-surface-sunken"
        >
          <ChevronLeft className="size-4.5" aria-hidden="true" />
          day {day}
        </button>
      )}
      <span className="flex-1" />
      {day < totalDays - 1 && (
        <button
          type="button"
          onClick={() => onChange(day + 1)}
          className="flex h-11 items-center gap-1 rounded-button bg-ink-900 pr-2.5 pl-4 text-sm font-bold text-white"
        >
          다음 날 · day {day + 2}
          <ChevronRight className="size-4.5" aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}
