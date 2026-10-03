"use client";

import { useMemo } from "react";

import { useTrips } from "@/entities/trip";
import type { DateRange, DateSelection } from "@/shared/lib/calendar";
import { useRangeCalendar } from "@/shared/lib/use-range-calendar";

/** 만들기 달력. 지난 날짜도 고를 수 있으니 지난 여행까지 「다른 일정」으로 깐다 */
export function useCreateCalendar(selection: DateSelection) {
  const { data: trips } = useTrips();
  const others = useMemo<DateRange[]>(
    () => (trips ?? []).map((t) => ({ start: t.start_date, end: t.end_date })),
    [trips],
  );
  return useRangeCalendar({ selection, others });
}
