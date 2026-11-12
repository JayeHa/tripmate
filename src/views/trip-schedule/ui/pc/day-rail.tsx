import type { ReactNode } from "react";

import { VisitProgress } from "@/entities/schedule-item";
import { dateRangeLabel, dateTone, dayCount, dayParts } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

import { DATE_TONE } from "../date-tone";

type DayRailProps = {
  title: string;
  startDate: string;
  endDate: string;
  day: number;
  onChange: (day: number) => void;
  /** 날마다 하루 요약(빈 날은 null) */
  summaries: readonly (string | null)[];
  /** 그 날의 여행지 공휴일 이름 — 날짜 아래 빨간 한 줄 */
  holidayOf: (day: number) => string | null;
  /** 제목 아래에 두는 것 — 「이어서 / 하루씩」 전환 */
  children?: ReactNode;
  /** 레일 아래 고정 도구(항공편 · 숙소) */
  footer?: ReactNode;
  /** 기록 모드 — 날마다 다녀온 곳 수 · 장소 수. 있으면 하루 요약 대신 진행 줄, 켜진 날은 초록 */
  progressOf?: (day: number) => { done: number; passed: number; total: number };
};

/**
 * PC 왼쪽 232px 날짜 레일. 여행명은 고정, day 목록만 스크롤한다.
 * 날마다 「day 2 11.1/일」(토 파랑 · 일 · 공휴일 빨강) 아래 공휴일 이름(있으면 빨갛게) · 하루 요약 2줄. 아래는 고정 도구(footer — 항공편 · 숙소).
 * 기록 모드(progressOf)는 하루 요약 대신 진행 줄(막대 4 + 「4/13」, 장소가 없는 날은 없음)이고 켜진 날 바탕 · 글자가 초록이다
 */
export function DayRail({
  title,
  startDate,
  endDate,
  day,
  onChange,
  summaries,
  holidayOf,
  children,
  footer,
  progressOf,
}: DayRailProps) {
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
        {children}
      </div>
      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-2"
        aria-label="날짜"
      >
        {Array.from({ length: total }, (_, i) => {
          const { date, dow } = dayParts(startDate, i);
          const summary = summaries[i];
          const holiday = holidayOf(i);
          const tone = dateTone(startDate, i, !!holiday);
          const progress = progressOf?.(i);
          return (
            <button
              key={date}
              type="button"
              aria-current={i === day ? "date" : undefined}
              onClick={() => onChange(i)}
              className={cn(
                "flex flex-col gap-0.5 rounded-card px-3 py-2.5 text-left",
                i === day ? activeBg(!!progressOf) : "hover:bg-surface-sunken",
              )}
            >
              <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span
                  className={cn(
                    "text-[15px] font-extrabold",
                    i === day ? activeTitle(!!progressOf) : "text-ink-600",
                  )}
                >
                  day {i + 1}
                </span>
                <span className={cn("text-[13px] text-ink-400", tone && DATE_TONE[tone])}>
                  {date}/{dow}
                </span>
              </span>
              {holiday && (
                <span className="truncate text-xs font-semibold text-holiday">{holiday}</span>
              )}
              {progress
                ? progress.total > 0 && (
                    <VisitProgress
                      compact
                      done={progress.done}
                      passed={progress.passed}
                      total={progress.total}
                    />
                  )
                : summary && (
                    <span className="line-clamp-2 text-[13px]/[1.45] text-ink-500">{summary}</span>
                  )}
            </button>
          );
        })}
      </nav>
      {footer}
    </aside>
  );
}

/** 켜진 날의 바탕 — 기록 모드는 옅은 초록 */
function activeBg(record: boolean): string {
  return record ? "bg-visited-rail" : "bg-surface-muted";
}

/** 켜진 날의 「day 2」 글자 — 기록 모드는 진한 초록 */
function activeTitle(record: boolean): string {
  return record ? "text-visited-strong" : "text-ink-900";
}
