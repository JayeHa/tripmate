"use client";

import { useMemo } from "react";

import { type DateRange, type DateSelection, monthCells, monthsSpanning } from "./calendar";
import { todayISO } from "./days";
import { isHoliday } from "./holidays";

/**
 * 고를 수 있는 달. 지난 여행도 기록할 수 있게 3년 전부터 1년 뒤까지 연다.
 * 기준 달과 오늘이 멀어도(오래전 여행을 오늘 이후로 옮길 때) 둘 다 담는다.
 */
const RANGE_PAST_MONTHS = 36;
const RANGE_FUTURE_MONTHS = 11;

type Options = {
  selection: DateSelection;
  /** 「다른 일정」 띠로 깔 기간들 */
  others: readonly DateRange[];
  /** 처음 보일 달이 속한 날짜. 없으면 오늘 */
  focus?: string;
};

/** 기간 달력에 그릴 달과 칸. 모바일·PC 가 같은 데이터를 다른 모양으로 그린다. */
export function useRangeCalendar({ selection, others, focus }: Options) {
  const today = todayISO();
  const center = focus ?? today;
  const { months, focusIndex } = useMemo(
    () => monthsSpanning(center, today, RANGE_PAST_MONTHS, RANGE_FUTURE_MONTHS),
    [center, today],
  );
  const cellsOf = (year: number, month: number) =>
    monthCells(year, month, { today, selection, others, isHoliday, allowPast: true });
  return { months, cellsOf, focusIndex };
}
