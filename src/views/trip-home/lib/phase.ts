import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** 요약 탭의 시점 — 여행 전 · 여행 중 · 여행 후 */
export const PHASES = ["pre", "now", "post"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABEL: Record<Phase, string> = {
  pre: "여행 전",
  now: "여행 중",
  post: "여행 후",
};

/** 오늘이 여행의 어느 시점인지. 출발일부터 마지막 날까지가 여행 중 */
export function tripPhase(startDate: string, endDate: string, today: string): Phase {
  if (today < startDate) return "pre";
  return today > endDate ? "post" : "now";
}

/**
 * 세그먼트 옆 회색 안내 — 날짜로 고른 시점이면 「날짜로 자동 선택」 · 「day 2 · 11.1」 · 「11.6 · 여행 끝」,
 * 다른 시점을 골라 보고 있으면 「미리보기」
 */
export function phaseNote(shown: Phase, startDate: string, endDate: string, today: string): string {
  const auto = tripPhase(startDate, endDate, today);
  if (shown !== auto) return "미리보기";
  const md = format(parseISO(today), "M.d");
  if (auto === "pre") return "날짜로 자동 선택";
  if (auto === "post") return `${md} · 여행 끝`;
  return `day ${differenceInCalendarDays(parseISO(today), parseISO(startDate)) + 1} · ${md}`;
}
