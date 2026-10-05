import type { CalendarCell, CalendarDay } from "@/shared/lib/calendar";
import { cn } from "@/shared/lib/utils";

/** 요일 머리 — 일요일은 빨강, 토요일은 블루 */
const WEEKDAYS = [
  { label: "일", tone: "text-destructive" },
  { label: "월", tone: "text-ink-400" },
  { label: "화", tone: "text-ink-400" },
  { label: "수", tone: "text-ink-400" },
  { label: "목", tone: "text-ink-400" },
  { label: "금", tone: "text-ink-400" },
  { label: "토", tone: "text-primary" },
] as const;

type DatePickerGridProps = {
  cells: readonly CalendarCell[];
  onPick: (date: string) => void;
};

/** 날짜 고르기 팝오버의 한 달 — 요일 머리 + 7열 칸(38), 날짜 원 34. 고른 기간은 사이를 연블루 띠로 잇는다 */
export function DatePickerGrid({ cells, onPick }: DatePickerGridProps) {
  return (
    <div className="grid grid-cols-7">
      {WEEKDAYS.map((w) => (
        <span key={w.label} className={cn("pb-1 text-center text-xs font-semibold", w.tone)}>
          {w.label}
        </span>
      ))}
      {cells.map((cell, i) =>
        cell.kind === "blank" ? (
          // 달 앞쪽 빈 칸은 위치 말고는 구분할 것이 없고 순서도 바뀌지 않는다
          // eslint-disable-next-line react/no-array-index-key
          <span key={`blank-${i}`} className="h-9.5" />
        ) : (
          <DayButton key={cell.date} cell={cell} onPick={onPick} />
        ),
      )}
    </div>
  );
}

type DayButtonProps = { cell: CalendarDay; onPick: (date: string) => void };

/** 날짜 하나 — 고른 날은 블루 원, 오늘은 회색 링, min 보다 앞은 흐리게 막는다 */
function DayButton({ cell, onPick }: DayButtonProps) {
  const edge = cell.selected === "start" || cell.selected === "end" || cell.selected === "single";
  return (
    <button
      type="button"
      disabled={cell.disabled}
      onClick={() => onPick(cell.date)}
      aria-label={cell.date}
      aria-pressed={edge}
      className="relative flex h-9.5 items-center justify-center disabled:cursor-default"
    >
      {cell.selected && cell.selected !== "single" && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0.5 bg-primary-tint",
            cell.selected === "start" ? "right-0 left-1/2" : "left-0",
            cell.selected === "end" ? "right-1/2" : "right-0",
          )}
        />
      )}
      <span
        className={cn(
          "relative flex size-8.5 items-center justify-center rounded-full text-sm",
          dayTone(cell, edge),
        )}
      >
        {cell.day}
      </span>
    </button>
  );
}

/** 날짜 원의 색. 고른 날 > 막힌 날 > 오늘 > 평일 */
function dayTone(cell: CalendarDay, edge: boolean) {
  if (edge) return "bg-primary font-extrabold text-white";
  if (cell.disabled) return "font-medium text-[#CCCCCC]";
  if (cell.today) return "font-extrabold text-ink-900 ring-[1.5px] ring-line-strong ring-inset";
  return "font-medium text-ink-800";
}
