import type { ExpenseSection } from "@/entities/expense";
import { type CountryHoliday, holidayName } from "@/shared/lib/country-holidays";
import { dayIndexToDate, dayOfWeek, dayParts } from "@/shared/lib/days";

import { periodParam } from "./period";

/** 달력 띠 한 칸 — 여행준비 또는 day N */
export type CalendarCell = {
  /** 묶음 · 칸을 잇는 키(주소의 period 값과 같다 — prep · 0-base 날) */
  key: string;
  /** 위 작은 글 — 「day 2」, 여행준비는 빈 글 */
  label: string;
  /** 큰 글 — 날짜의 일(「31」 · 「1」), 여행준비는 「준비」(조금 작게) */
  num: string;
  /** 아래 작은 글 — 요일(「토」), 여행준비는 「여행 전」 */
  sub: string;
  /** 토 · 일이면 요일 색을 다르게(토 블루 · 일 빨강) */
  weekend: "sat" | "sun" | null;
  /** 여행지 공휴일 이름 — 있으면 일요일처럼 빨갛고, 칸에 이름을 단다(title) */
  holiday: string | null;
  /** 지출이 있는 날 — 없으면 회색 */
  hasExpense: boolean;
  /** 결제 예정 비용이 있는 날 — 노란 점 */
  planned: boolean;
};

/** 주말 요일(Date.getDay) — 토 · 일 */
const WEEKEND: Partial<Record<number, "sat" | "sun">> = { 6: "sat", 0: "sun" };

/** 묶음(여행준비 · day N)마다 달력 띠 한 칸. holidays 는 여행지 공휴일(받기 전이면 undefined — 칠하지 않는다) */
export function calendarCells(
  sections: ExpenseSection[],
  startDate: string,
  holidays: readonly CountryHoliday[] | undefined = [],
): CalendarCell[] {
  return sections.map(({ period, expenses }) => {
    const common = {
      key: periodParam(period),
      hasExpense: expenses.length > 0,
      planned: expenses.some((e) => !e.paid),
    };
    if (period === "prep") {
      return {
        ...common,
        label: "",
        num: "준비",
        sub: "여행 전",
        weekend: null,
        holiday: null,
      };
    }
    const { date, dow } = dayParts(startDate, period);
    return {
      ...common,
      label: `day ${period + 1}`,
      num: date.split(".")[1],
      sub: dow,
      weekend: WEEKEND[dayOfWeek(startDate, period)] ?? null,
      holiday: holidayName(holidays, dayIndexToDate(startDate, period)),
    };
  });
}
