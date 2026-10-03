"use client";

import { useMemo } from "react";
import { useTrips } from "@/entities/trip";
import {
  type DateRange,
  type DateSelection,
  monthCells,
  monthsAround,
} from "@/shared/lib/calendar";
import { todayISO } from "@/shared/lib/days";
import { isHoliday } from "@/shared/lib/holidays";
import { FUTURE_MONTHS, PAST_MONTHS } from "../lib/range";

/** 만들기 달력에 그릴 달과 칸. 모바일·PC 가 같은 데이터를 다른 모양으로 그린다. */
export function useCreateCalendar(selection: DateSelection) {
  const { data: trips } = useTrips();
  const today = todayISO();
  // 지난 날짜도 고를 수 있으니 지난 여행까지 「다른 일정」으로 깐다
  const others = useMemo<DateRange[]>(
    () => (trips ?? []).map((t) => ({ start: t.start_date, end: t.end_date })),
    [trips],
  );
  const months = useMemo(() => monthsAround(today, PAST_MONTHS, FUTURE_MONTHS), [today]);
  const cellsOf = (year: number, month: number) =>
    monthCells(year, month, { today, selection, others, isHoliday, allowPast: true });
  return { months, cellsOf };
}
