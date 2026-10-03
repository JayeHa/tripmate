import { dayCount, dayIndexToDate } from "@/shared/lib/days";

/**
 * 기간을 줄여 사라지는 날. 줄지 않으면 null. day 는 1부터 센다.
 * fromDate 는 지금 기간에서 잘리는 첫날 — 그날부터의 지출이 마지막 날로 모인다.
 */
export type Shrink = { lastDay: number; fromDay: number; toDay: number; fromDate: string };

export function shrinkOf(
  current: { start: string; end: string },
  next: { start: string; end: string },
): Shrink | null {
  const before = dayCount(current.start, current.end);
  const after = dayCount(next.start, next.end);
  if (after >= before) return null;
  return {
    lastDay: after,
    fromDay: after + 1,
    toDay: before,
    fromDate: dayIndexToDate(current.start, after),
  };
}
