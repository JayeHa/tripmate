"use client";

import { useMemo } from "react";

import { type Trip, useTrips } from "@/entities/trip";
import type { DateRange, DateSelection } from "@/shared/lib/calendar";
import { useRangeCalendar } from "@/shared/lib/use-range-calendar";

/** 수정 달력. 자기 자신은 「다른 일정」에서 빼고, 이 여행의 출발 달부터 보인다 */
export function useEditCalendar(trip: Trip, selection: DateSelection) {
  const { data: trips } = useTrips();
  const others = useMemo<DateRange[]>(
    () =>
      (trips ?? [])
        .filter((t) => t.id !== trip.id)
        .map((t) => ({ start: t.start_date, end: t.end_date })),
    [trips, trip.id],
  );
  return useRangeCalendar({ selection, others, focus: trip.start_date });
}
