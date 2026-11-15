"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";

import { type ScheduleItem, useVisitMarks, type VisitMark } from "@/entities/schedule-item";
import { todayISO } from "@/shared/lib/days";

/** 상세 「방문」 줄 — 지금 표시와 누르기 */
export type VisitToggle = {
  mark: VisitMark | null;
  /** 그 표시를 켠다. 이미 켜져 있으면 끈다(표시 없음 = 아직 남은 곳) */
  toggle: (mark: VisitMark) => void;
};

/**
 * 상세 「방문」 줄(다녀왔어요 · 패스) — 일정 화면의 회색과 홈 「다음 장소」 가 같은 표시를 본다(일행 공유).
 * 오늘까지의 장소 일정만 — 항공편 · 메모 · 대체 장소, 오늘 뒤의 날, 여행 전에는 null(줄을 그리지 않는다).
 * 여행이 끝났으면 모든 날이 오늘 앞이라 줄이 있다 — 빠뜨린 곳을 다녀온 뒤에 고친다(2026-11-16 사용자 결정)
 */
export function useVisitToggle(
  tripId: string,
  startDate: string,
  item: ScheduleItem,
): VisitToggle | null {
  const [marks, setMark] = useVisitMarks(tripId);
  const today = differenceInCalendarDays(parseISO(todayISO()), parseISO(startDate));
  if (today < 0) return null;
  if (item.kind !== "place" || item.alternative_of !== null || item.day_index > today) return null;
  const mark = marks[item.id] ?? null;
  return { mark, toggle: (next) => setMark(item.id, mark === next ? null : next) };
}
