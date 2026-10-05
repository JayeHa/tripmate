import { dateRangeLabel, dayCount, dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

type DayRailProps = {
  title: string;
  startDate: string;
  endDate: string;
  day: number;
  onChange: (day: number) => void;
  /** 날마다 하루 요약(빈 날은 null) */
  summaries: readonly (string | null)[];
};

/**
 * PC 왼쪽 232px 날짜 레일. 여행명은 고정, day 목록만 스크롤한다.
 * 날마다 「day 2 11.1/일」 아래 하루 요약 2줄. 아래 도구(항공편 · 숙소)는 그 단계에서 붙인다.
 */
export function DayRail({ title, startDate, endDate, day, onChange, summaries }: DayRailProps) {
  const total = dayCount(startDate, endDate);
  return (
    <aside className="flex w-58 shrink-0 flex-col border-r border-divider">
      <div className="flex flex-col gap-1 px-5 pt-5 pb-3.5">
        <span className="truncate text-[19px] font-extrabold tracking-[-0.02em] text-ink-900">
          {title}
        </span>
        <span className="text-[13px] text-ink-400">
          {dateRangeLabel(startDate, endDate)} · {total - 1}박 {total}일
        </span>
      </div>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-2"
        aria-label="날짜"
      >
        {Array.from({ length: total }, (_, i) => {
          const { date, dow } = dayParts(startDate, i);
          const summary = summaries[i];
          return (
            <button
              key={date}
              type="button"
              aria-current={i === day ? "date" : undefined}
              onClick={() => onChange(i)}
              className={cn(
                "flex flex-col gap-0.5 rounded-card px-3 py-2.5 text-left",
                i === day ? "bg-surface-muted" : "hover:bg-surface-sunken",
              )}
            >
              <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span
                  className={cn(
                    "text-[15px] font-extrabold",
                    i === day ? "text-ink-900" : "text-ink-600",
                  )}
                >
                  day {i + 1}
                </span>
                <span className="text-[13px] text-ink-400">
                  {date}/{dow}
                </span>
              </span>
              {summary && (
                <span className="line-clamp-2 text-[13px]/[1.45] text-ink-500">{summary}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
