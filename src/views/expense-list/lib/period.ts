import type { ExpensePeriod } from "@/entities/expense";
import { dayParts } from "@/shared/lib/days";

/** 묶음 머리 — 「여행준비」 또는 「day 1」 + 「10.31/토」 */
export function periodLabel(
  period: ExpensePeriod,
  startDate: string,
): { label: string; date: string } {
  if (period === "prep") return { label: "여행준비", date: "" };
  const { date, dow } = dayParts(startDate, period);
  return { label: `day ${period + 1}`, date: `${date}/${dow}` };
}

/**
 * 「비용 추가」 주소의 period 값 — 여행준비는 prep, 그 밖은 0-base 날.
 * 이름이 day 가 아닌 이유: 하단 탭이 주소의 day 를 일정 탭에 이어 붙인다(tripTabHref) — 지출의 prep 이 일정으로 넘어가면 안 된다
 */
export function periodParam(period: ExpensePeriod): string {
  return period === "prep" ? "prep" : String(period);
}
