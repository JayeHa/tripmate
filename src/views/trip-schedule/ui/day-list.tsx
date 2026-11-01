"use client";

import { Skeleton } from "@/shared/ui/skeleton";
import { WeatherCredit } from "@/shared/ui/weather";

import { DaySection } from "./day-section";
import type { ScheduleLayoutProps } from "./schedule-layout";

type DayListProps = Pick<
  ScheduleLayoutProps,
  | "trip"
  | "sections"
  | "isPending"
  | "onOpen"
  | "onEditMove"
  | "onAddPlace"
  | "onAddDayMemo"
  | "authorOf"
  | "checklistOf"
  | "voucherOf"
  | "startEditAt"
  | "holidayOf"
  | "weatherOf"
  | "past"
> & {
  /** PC 는 day 헤더 아래에 「메모 N개 · 장소 N곳」 */
  showCounts?: boolean;
  /** 지도에 강조된 장소 */
  focusId: string | null;
};

/**
 * 이어서 보기 — 모든 날짜를 차례로(날짜마다 DaySection). 일정 · 여행을 읽는 동안은 자리 표시만.
 * 날씨를 하나라도 보이면 맨 아래 날씨 출처(CC BY 4.0)
 */
export function DayList({
  trip,
  sections,
  isPending,
  startEditAt,
  holidayOf,
  weatherOf,
  ...rest
}: DayListProps) {
  if (isPending || !trip) {
    return (
      <div className="flex flex-col gap-3 px-4 pt-5">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
    );
  }
  return (
    <>
      {sections.map(({ day, rows }) => (
        <DaySection
          key={day}
          startDate={trip.start_date}
          day={day}
          summary={trip.day_summaries[day]}
          holiday={holidayOf(day)}
          weather={weatherOf(day)}
          rows={rows}
          onStartEdit={startEditAt(day)}
          {...rest}
        />
      ))}
      {sections.some(({ day }) => weatherOf(day)) && (
        <p className="px-5 pb-6">
          <WeatherCredit />
        </p>
      )}
    </>
  );
}
