import { differenceInCalendarDays, parseISO } from "date-fns";

import { nightsLabel } from "@/shared/lib/date-field";
import { dateRangeLabel } from "@/shared/lib/days";

/**
 * 홈 머리의 D-day 칩 — 출발 전 「D-28」, 여행 중 「여행 2일째」(출발일이 「여행 1일째」), 끝난 뒤 「여행 끝」
 */
export function ddayChipLabel(startDate: string, endDate: string, today: string): string {
  const untilStart = differenceInCalendarDays(parseISO(startDate), parseISO(today));
  if (untilStart > 0) return `D-${untilStart}`;
  if (differenceInCalendarDays(parseISO(endDate), parseISO(today)) >= 0)
    return `여행 ${1 - untilStart}일째`;
  return "여행 끝";
}

/** 홈 머리의 기간 — 「2026.10.31 - 11.4 · 4박 5일」 */
export function homeRangeLabel(startDate: string, endDate: string): string {
  return `${dateRangeLabel(startDate, endDate)} · ${nightsLabel(startDate, endDate)}`;
}

/** 모바일 홈 머리가 접히는 스크롤 위치(px) — 넘으면 접고, 접힌 뒤에는 이보다 위로 와야 편다 */
const COLLAPSE_AT = 80;
const EXPAND_AT = 24;

/**
 * 스크롤 위치로 접힘을 정한다. 접는 곳과 펴는 곳을 달리 둬서 경계 근처에서 깜빡이지 않게 한다
 */
export function nextCollapsed(collapsed: boolean, scrollY: number): boolean {
  return collapsed ? scrollY > EXPAND_AT : scrollY > COLLAPSE_AT;
}
