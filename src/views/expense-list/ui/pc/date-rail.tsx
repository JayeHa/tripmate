import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import type { CalendarCell } from "../../lib/calendar";

/** 레일 한 줄 — 달력 칸 + 그 날 합계(합계에 넣는 비용만) */
export type RailItem = CalendarCell & { total: number };

type DateRailProps = {
  items: RailItem[];
  home: string;
  selected: string;
  onSelect: (key: string) => void;
};

/** 요일 색 — 토 블루 · 일 빨강 */
const DOW_TONE = { sat: "text-primary", sun: "text-destructive" } as const;

/**
 * PC 날짜 레일(200) — 「전체」 · 「준비 · 여행 전」 · 「day N · 10.31 토」 + 그 날 합계. 누르면 표가 그 날로 스크롤하고,
 * 표를 스크롤하면 따라 고른다. 고른 줄은 회색 바탕 · 굵게, 비용이 없는 날은 흐리게
 */
export function DateRail({ items, home, selected, onSelect }: DateRailProps) {
  return (
    <nav
      aria-label="날짜"
      className="flex w-50 shrink-0 flex-col gap-1 overflow-y-auto border-r border-divider px-3 py-5"
    >
      <span className="px-2.5 pb-2 text-[13px] font-bold text-ink-400">날짜</span>
      <RailButton on={selected === "all"} onClick={() => onSelect("all")} label="전체" />
      {items.map((item) => {
        const dim = !item.hasExpense;
        const sub = item.key === "prep" ? "여행 전" : item.num;
        return (
          <RailButton
            key={item.key}
            on={selected === item.key}
            onClick={() => onSelect(item.key)}
            label={item.key === "prep" ? "준비" : item.label}
            dim={dim}
            sum={item.hasExpense ? formatMoney(item.total, home) : ""}
          >
            <span className={cn("text-xs", dim ? "text-line-strong" : "text-ink-400")}>
              {sub}{" "}
              {item.key !== "prep" && (
                <span
                  className={
                    dim ? undefined : (item.weekend && DOW_TONE[item.weekend]) || undefined
                  }
                >
                  {item.sub}
                </span>
              )}
            </span>
          </RailButton>
        );
      })}
    </nav>
  );
}

type RailButtonProps = {
  on: boolean;
  onClick: () => void;
  label: string;
  dim?: boolean;
  sum?: string;
  children?: React.ReactNode;
};

/** 레일 한 줄의 단추 — 왼쪽 이름(+ 날짜), 오른쪽 합계 */
function RailButton({ on, onClick, label, dim = false, sum = "", children }: RailButtonProps) {
  return (
    <button
      type="button"
      aria-current={on ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-card p-2.5 text-left hover:bg-surface-sunken",
        on && "bg-surface-muted hover:bg-surface-muted",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm",
            on ? "font-extrabold" : "font-semibold",
            dim ? "text-line-dashed" : "text-ink-900",
          )}
        >
          {label}
        </span>
        {children}
      </span>
      <span className="text-xs font-bold text-ink-500">{sum}</span>
    </button>
  );
}
