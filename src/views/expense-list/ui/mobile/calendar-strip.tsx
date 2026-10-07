import type { Ref } from "react";

import { cn } from "@/shared/lib/utils";

import type { CalendarCell } from "../../lib/calendar";

type CalendarStripProps = {
  cells: CalendarCell[];
  selected: string;
  onSelect: (key: string) => void;
  stripRef: Ref<HTMLDivElement>;
};

/** 요일 글 색 — 토 블루 · 일 빨강 · 평일 회색. 지출 없는 날은 모두 흐리게 */
const SUB_TONE = { sat: "text-primary", sun: "text-destructive" } as const;

/**
 * 여행 날짜 달력 띠 — 탭 아래에 붙는다(sticky). 칸 = 「day N」 11 · 일 19/800 · 요일 11, 아래 결제 예정 점.
 * 고른 칸은 회색 둥근 바탕, 지출이 없는 날은 회색 글. 긴 여행은 칸이 너무 좁아지지 않게 가로로 넘친다(44 이상)
 */
export function CalendarStrip({ cells, selected, onSelect, stripRef }: CalendarStripProps) {
  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label="날짜"
      className="sticky top-[calc(var(--shell-top)+3.25rem+2.625rem)] z-10 grid scrollbar-none auto-cols-[minmax(2.75rem,1fr)] grid-flow-col gap-0.5 overflow-x-auto border-y border-divider bg-white px-2.5 pt-1.5 pb-2.5"
    >
      {cells.map((cell) => {
        const on = cell.key === selected;
        const dim = !cell.hasExpense && cell.key !== "prep";
        return (
          <button
            key={cell.key}
            type="button"
            role="tab"
            aria-selected={on}
            data-key={cell.key}
            onClick={() => onSelect(cell.key)}
            className={cn(
              "flex flex-col items-center gap-0.75 rounded-card pt-1.75 pb-2",
              on && "bg-surface-muted",
            )}
          >
            <span
              className={cn(
                "h-3.5 text-[11px] font-semibold",
                dim ? "text-line-dashed" : "text-ink-700",
              )}
            >
              {cell.label}
            </span>
            <span
              className={cn(
                "flex h-6 items-center font-extrabold",
                cell.key === "prep" ? "text-[15px]" : "text-[19px]",
                dim ? "text-line-dashed" : "text-ink-900",
              )}
            >
              {cell.num}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold",
                dim
                  ? "text-line-strong"
                  : (cell.weekend && SUB_TONE[cell.weekend]) || "text-ink-400",
              )}
            >
              {cell.sub}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "size-1 rounded-full",
                cell.planned ? "bg-planned-dot" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
