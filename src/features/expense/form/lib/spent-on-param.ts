import { dayCount, dayIndexToDate } from "@/shared/lib/days";

/** 주소의 period(prep · 0-base 날)를 처음 날짜로 — 여행준비는 "", 모르는 값 · 기간 밖이면 undefined(여행 첫날) */
export function spentOnFromParam(
  period: string | null,
  start: string,
  end: string,
): string | undefined {
  if (period === "prep") return "";
  const index = Number(period);
  if (period === null || !Number.isInteger(index) || index < 0 || index >= dayCount(start, end)) {
    return undefined;
  }
  return dayIndexToDate(start, index);
}
