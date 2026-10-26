import { differenceInCalendarDays, parseISO } from "date-fns";

/** 히어로 문구 — 큰 제목과 접혔을 때 ✕ 옆에 쓰는 짧은 문구 */
export type HeroCopy = { headline: string; short: string };

/**
 * 오늘 기준 히어로 문구. 출발 전 · 당일은 시안대로 「두근두근, 여행 D-28」 · 「두근두근, 여행 D-DAY」.
 * 여행 중 · 끝난 뒤는 시안에 없어 임시 문구다 — 홈 시안이 오면 이 함수만 바꾼다
 */
export function heroCopy(startDate: string, endDate: string, today: string): HeroCopy {
  const untilStart = differenceInCalendarDays(parseISO(startDate), parseISO(today));
  if (untilStart > 0)
    return { headline: `두근두근, 여행 D-${untilStart}`, short: `여행 D-${untilStart}` };
  if (untilStart === 0) return { headline: "두근두근, 여행 D-DAY", short: "여행 D-DAY" };
  if (differenceInCalendarDays(parseISO(endDate), parseISO(today)) >= 0) {
    const day = 1 - untilStart;
    return { headline: `즐거운 여행 중, day ${day}`, short: `여행 day ${day}` };
  }
  return { headline: "즐거웠던 여행", short: "지난 여행" };
}

/** 모바일 히어로가 접히는 스크롤 위치(px) — 넘으면 접고, 접힌 뒤에는 이보다 위로 와야 편다 */
const COLLAPSE_AT = 80;
const EXPAND_AT = 24;

/**
 * 스크롤 위치로 접힘을 정한다. 접는 곳과 펴는 곳을 달리 둬서 경계 근처에서 깜빡이지 않게 한다
 */
export function nextCollapsed(collapsed: boolean, scrollY: number): boolean {
  return collapsed ? scrollY > EXPAND_AT : scrollY > COLLAPSE_AT;
}
