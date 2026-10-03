"use client";

import { useMemo } from "react";

import { type DateRange, type DateSelection, monthCells, monthsAround } from "./calendar";
import { todayISO } from "./days";
import { isHoliday } from "./holidays";

/**
 * 고를 수 있는 달. 지난 여행도 기록할 수 있게 기준 달 3년 전부터 1년 뒤까지 연다
 * (시안 수정 모드와 같은 범위). 기준 달은 months[RANGE_PAST_MONTHS] 에 온다.
 */
export const RANGE_PAST_MONTHS = 36;
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
  const months = useMemo(
    () => monthsAround(center, RANGE_PAST_MONTHS, RANGE_FUTURE_MONTHS),
    [center],
  );
  const cellsOf = (year: number, month: number) =>
    monthCells(year, month, { today, selection, others, isHoliday, allowPast: true });
  return { months, cellsOf, focusIndex: RANGE_PAST_MONTHS };
}
