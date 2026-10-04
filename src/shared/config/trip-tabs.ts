import { CalendarDays, House, NotebookPen, Receipt, Settings } from "lucide-react";

/**
 * 여행 안 5개 탭. 모바일 하단 탭과 PC 헤더가 같은 목록을 쓴다.
 * 지도는 일정 하위, 정산은 가계부 하위라 탭에 없다. (design_handoff_tripmate/README.md · 앱 흐름 · 17)
 */
export const TRIP_TABS = [
  { key: "home", label: "홈", icon: House },
  { key: "schedule", label: "일정", icon: CalendarDays, keepDay: true },
  { key: "expenses", label: "가계부", icon: Receipt },
  { key: "notes", label: "노트", icon: NotebookPen },
  { key: "settings", label: "설정", icon: Settings },
] as const;

export type TripTab = (typeof TRIP_TABS)[number];

/** 탭 링크. 일정 탭은 보고 있던 day 를 이어서 연다 */
export function tripTabHref(tripId: string, tab: TripTab, day: string | null): string {
  const base = `/trips/${tripId}/${tab.key}`;
  return "keepDay" in tab && day ? `${base}?day=${day}` : base;
}

/** 지금 경로의 탭. 하위 라우트(일정 > 지도, 가계부 > 정산)에서도 부모 탭이 활성이다 */
export function activeTripTab(pathname: string, tripId: string): TripTab["key"] | null {
  return TRIP_TABS.find((tab) => pathname.startsWith(`/trips/${tripId}/${tab.key}`))?.key ?? null;
}
