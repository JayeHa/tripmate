import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

/** 여행 일수 (start/end 포함) */
export function dayCount(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
}

/** dayIndex(0-base)에 해당하는 날짜 (yyyy-MM-dd) */
export function dayIndexToDate(startDate: string, dayIndex: number): string {
  return format(addDays(parseISO(startDate), dayIndex), "yyyy-MM-dd");
}

/** 날짜(yyyy-MM-dd) → dayIndex. 범위를 벗어나면 0 ~ 마지막 날로 clamp */
export function dateToDayIndex(startDate: string, endDate: string, date: string): number {
  const idx = differenceInCalendarDays(parseISO(date), parseISO(startDate));
  return Math.min(Math.max(idx, 0), dayCount(startDate, endDate) - 1);
}

/** "10.29 (수)" */
export function dayLabel(startDate: string, dayIndex: number): string {
  return format(addDays(parseISO(startDate), dayIndex), "M.d (EEE)", { locale: ko });
}

/** "2026.10.29 - 11.2" */
export function dateRangeLabel(startDate: string, endDate: string): string {
  const s = parseISO(startDate);
  const e = parseISO(endDate);
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${format(s, "yyyy.M.d")} - ${format(e, sameYear ? "M.d" : "yyyy.M.d")}`;
}
