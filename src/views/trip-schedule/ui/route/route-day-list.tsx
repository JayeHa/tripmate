"use client";

import type { Trip } from "@/entities/trip";
import { Skeleton } from "@/shared/ui/skeleton";
import { WeatherCredit } from "@/shared/ui/weather";

import { useFlightTimes } from "../../model/use-flight-times";
import type { ScheduleLayoutProps } from "../schedule-layout";
import { RouteDaySection, type RouteDaySectionProps } from "./route-day-section";

type RouteDaysProps = Pick<
  ScheduleLayoutProps,
  | "sections"
  | "holidayOf"
  | "weatherOf"
  | "past"
  | "onOpen"
  | "onEditMove"
  | "checklistOf"
  | "voucherOf"
> &
  Pick<
    RouteDaySectionProps,
    "openId" | "onToggle" | "onShowMap" | "onAddMemo" | "focusId" | "showPins" | "hover"
  > & {
    trip: Trip;
  };

type RouteDayListProps = Omit<RouteDaysProps, "trip"> &
  Pick<ScheduleLayoutProps, "trip" | "isPending">;

/** 노선도 목록(모바일 · PC) — 일정 · 여행을 읽는 동안은 자리 표시만 */
export function RouteDayList({ trip, isPending, ...rest }: RouteDayListProps) {
  if (isPending || !trip) {
    return (
      <div className="flex flex-col gap-3 px-4 pt-5">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
    );
  }
  return <RouteDays trip={trip} {...rest} />;
}

/**
 * 모든 날짜를 이어서(날짜마다 RouteDaySection). 항공편 카드는 항공편 목록의 편명 시각으로 비행 구간을 센다.
 * 날씨를 하나라도 보이면 맨 아래 날씨 출처(CC BY 4.0)
 */
function RouteDays({ trip, sections, holidayOf, weatherOf, ...rest }: RouteDaysProps) {
  const flightOf = useFlightTimes(trip.id);
  return (
    <>
      {sections.map(({ day, rows }) => (
        <RouteDaySection
          key={day}
          startDate={trip.start_date}
          day={day}
          rows={rows}
          summary={trip.day_summaries[day]}
          holiday={holidayOf(day)}
          weather={weatherOf(day)}
          flightOf={flightOf}
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
