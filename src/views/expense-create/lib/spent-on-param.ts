import { dayCount, dayIndexToDate } from "@/shared/lib/days";

/** 주소의 day(prep · 0-base 날)를 처음 날짜로 — 여행준비는 "", 모르는 값 · 기간 밖이면 undefined(여행 첫날) */
export function spentOnFromParam(
  day: string | null,
  start: string,
  end: string,
): string | undefined {
  if (day === "prep") return "";
  const index = Number(day);
  if (day === null || !Number.isInteger(index) || index < 0 || index >= dayCount(start, end)) {
    return undefined;
  }
  return dayIndexToDate(start, index);
}
