import type { Ref } from "react";

import { cn } from "@/shared/lib/utils";

import type { CalendarCell } from "../../lib/calendar";

type CalendarStripProps = {
  cells: CalendarCell[];
  selected: string;
  onSelect: (key: string) => void;
  /** 붙는 칸(높이 0) — 날짜 고르기 훅이 기준선을 잰다 */
  stripRef: Ref<HTMLDivElement>;
  /** 「+ 비용 추가」 가 화면 위로 사라졌다 — 날짜 줄을 보인다 */
  shown: boolean;
};

/** 칸 색 — 토 블루 · 일 빨강(첫 줄도 같은 색), 평일은 첫 줄 잉크 · 둘째 줄 진회색, 여행준비 둘째 줄 회색 */
const TONE = {
  sat: { label: "text-brand", sub: "text-brand" },
  sun: { label: "text-destructive", sub: "text-destructive" },
  weekday: { label: "text-ink-900", sub: "text-ink-700" },
  prep: { label: "text-ink-900", sub: "text-ink-400" },
} as const;

/** 칸 색의 종류 */
function toneOf(cell: CalendarCell): keyof typeof TONE {
  if (cell.key === "prep") return "prep";
  return cell.weekend ?? "weekday";
}

/**
 * 날짜 이동 줄 — 높이 0 인 붙는 칸 안에 떠서 목록을 밀지 않는다. 처음엔 숨기고, 「+ 비용 추가」 가 위로 사라지면
 * 0.2초 동안 나타나며 8px 내려온다(맨 위로 돌아오면 반대로). 칸 = 「day 1」 15/800 · 「31 토」 11/600 · 결제 예정 점,
 * 고른 칸은 회색 바탕, 지출 없는 날은 흐리게. 긴 여행은 칸이 좁아지지 않게 가로로 넘친다(44 이상)
 */
export function CalendarStrip({ cells, selected, onSelect, stripRef, shown }: CalendarStripProps) {
  return (
    <div
      ref={stripRef}
      className="sticky top-[calc(var(--shell-top)+3.25rem+2.625rem)] z-10 h-0 overflow-visible"
    >
      <div
        role="tablist"
        aria-label="날짜"
        aria-hidden={!shown}
        className={cn(
          "absolute inset-x-0 top-0 grid scrollbar-none auto-cols-[minmax(2.75rem,1fr)] grid-flow-col gap-0.5 overflow-x-auto border-b border-divider bg-white px-2.5 pt-1 pb-1.5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-[opacity,translate] duration-200",
          shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        {cells.map((cell) => {
          const on = cell.key === selected;
          const dim = !cell.hasExpense && cell.key !== "prep";
          const tone = TONE[toneOf(cell)];
          return (
            <button
              key={cell.key}
              type="button"
              role="tab"
              tabIndex={shown ? undefined : -1}
              aria-selected={on}
              data-key={cell.key}
              onClick={() => onSelect(cell.key)}
              className={cn(
                "flex flex-col items-center gap-px rounded-memo pt-1.25 pb-1",
                on && "bg-surface-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-5 items-center text-[15px] font-extrabold whitespace-nowrap",
                  dim ? "text-line-dashed" : tone.label,
                )}
              >
                {cell.key === "prep" ? "준비" : cell.label}
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold whitespace-nowrap",
                  dim ? "text-line-strong" : tone.sub,
                )}
              >
                {cell.key === "prep" ? cell.sub : `${cell.num} ${cell.sub}`}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-px size-1 rounded-full",
                  cell.planned ? "bg-planned-dot" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
