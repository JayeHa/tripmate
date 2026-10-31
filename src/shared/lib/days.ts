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

/** dayIndex(0-base)의 요일. Date.getDay() 와 같다(0 = 일요일) */
export function dayOfWeek(startDate: string, dayIndex: number): number {
  return addDays(parseISO(startDate), dayIndex).getDay();
}

/** 날짜 색의 종류 — 토요일 「sat」(파랑), 일요일 · 공휴일 「sun」(빨강), 평일 null */
export function dateTone(
  startDate: string,
  dayIndex: number,
  holiday: boolean,
): "sat" | "sun" | null {
  const dow = dayOfWeek(startDate, dayIndex);
  if (holiday || dow === 0) return "sun";
  return dow === 6 ? "sat" : null;
}

/** day 칩 · day 헤더용 날짜 조각: { date: "10.31", dow: "토" } */
export function dayParts(startDate: string, dayIndex: number): { date: string; dow: string } {
  const d = addDays(parseISO(startDate), dayIndex);
  return { date: format(d, "M.d"), dow: format(d, "EEE", { locale: ko }) };
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

/** "10.31 - 11.4". 연도가 바뀌면 "2026.12.30 - 2027.1.2" (PC 헤더의 여행 칩) */
export function shortRangeLabel(startDate: string, endDate: string): string {
  const s = parseISO(startDate);
  const e = parseISO(endDate);
  if (s.getFullYear() === e.getFullYear()) return `${format(s, "M.d")} - ${format(e, "M.d")}`;
  return `${format(s, "yyyy.M.d")} - ${format(e, "yyyy.M.d")}`;
}

/**
 * 출발일까지 남은 일수. 오늘이면 "D-DAY", 이미 지났으면 null.
 * 기준일을 받는 이유는 테스트에서 오늘을 고정하기 위해서다.
 */
export function ddayLabel(startDate: string, today: string): string | null {
  const diff = differenceInCalendarDays(parseISO(startDate), parseISO(today));
  if (diff < 0) return null;
  return diff === 0 ? "D-DAY" : `D-${diff}`;
}

/** 오늘 날짜 (yyyy-MM-dd, 로컬 기준) */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** 지금 시각 (HH:mm, 로컬 기준) */
export function nowHHmm(): string {
  return format(new Date(), "HH:mm");
}
