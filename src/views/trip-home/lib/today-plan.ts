import { differenceInCalendarDays, parseISO } from "date-fns";

import {
  CATEGORY_LABEL,
  itemName,
  type PlaceCategory,
  placeNumbers,
  type ReservationStatus,
  type ScheduleItem,
} from "@/entities/schedule-item";
import { dayCount } from "@/shared/lib/days";

/**
 * 상태판이 보는 날(0-base) — 여행 중이면 오늘, 여행 전 · 후에 「여행 중」 을 미리 보면 첫날 · 마지막 날
 */
export function boardDayIndex(startDate: string, endDate: string, today: string): number {
  const diff = differenceInCalendarDays(parseISO(today), parseISO(startDate));
  return Math.min(Math.max(diff, 0), dayCount(startDate, endDate) - 1);
}

/** 오늘 카드의 장소 한 줄 */
export type PlaceLine = {
  id: string;
  /** 그날 장소 번호(타임라인 · 지도와 같은 값). 위치가 없으면 null */
  num: number | null;
  status: ReservationStatus | null;
  name: string;
  sub: string;
  /** 「HH:mm」, 없으면 null */
  time: string | null;
  /** 구글맵 길찾기에 쓸 좌표. 위치가 없으면 null */
  coords: { lat: number; lng: number } | null;
};

/** 오늘 카드 — 자유 일정(장소 없음) · 다 마침 · 다음 장소 */
export type TodayPlan =
  | { kind: "free" }
  /** last = 마지막 장소의 자리 — 「되돌리기」 로 돌아갈 곳 */
  | { kind: "done"; tomorrow: string | null; last: number }
  | { kind: "next"; index: number; label: string; place: PlaceLine; after: PlaceLine[] };

/** 그날의 장소 일정(대체 장소 · 메모 · 항공편은 빼고), 순서대로 */
function dayPlaces(items: ScheduleItem[], dayIndex: number): ScheduleItem[] {
  return items
    .filter((i) => i.day_index === dayIndex && i.kind === "place" && i.alternative_of === null)
    .sort((a, b) => a.position - b.position);
}

/** 「HH:mm」 — 시간이 없으면 null */
function hhmm(item: ScheduleItem): string | null {
  return item.start_time?.slice(0, 5) ?? null;
}

/** 장소 분류 이름. 모르는 값이면 null */
function categoryOf(item: ScheduleItem): string | null {
  const c = item.place?.category as PlaceCategory | undefined;
  return (c && CATEGORY_LABEL[c]) || null;
}

/** 일정 → 장소 한 줄. sub 는 부르는 쪽이 정한다 */
function lineOf(item: ScheduleItem, nums: Map<string, number>, sub: string): PlaceLine {
  const { lat, lng } = item.place ?? {};
  return {
    id: item.id,
    num: nums.get(item.id) ?? null,
    status: (item.status as ReservationStatus | null) ?? null,
    name: itemName(item),
    sub,
    time: hhmm(item),
    coords: lat != null && lng != null ? { lat, lng } : null,
  };
}

/**
 * 시각이 지난 마지막 일정의 자리 — 그 앞의 시간 없는 일정은 지나간 것으로 본다. 없으면 0.
 * now 가 null 이면(오늘이 아닌 날을 미리 볼 때) 시각으로 건너뛰지 않는다
 */
function timeFloor(places: ScheduleItem[], now: string | null): number {
  if (!now) return 0;
  return places.reduce((floor, p, i) => {
    const t = hhmm(p);
    return t && t <= now ? i : floor;
  }, 0);
}

/** 다음 장소 위의 파란 글 — 시각이 있으면 「다음 장소 · 16:00」, 없으면 순서(첫 일정이면 「오늘 첫 일정」) */
function nextLabel(place: ScheduleItem, index: number): string {
  const t = hhmm(place);
  if (t) return `다음 장소 · ${t}`;
  return index === 0 ? "오늘 첫 일정" : `다음 장소 · 오늘 ${index + 1}번째`;
}

/** 다 마쳤을 때 아래 글 — 「내일 첫 일정 · day 3 시부야 스카이 17:30」. 내일 일정이 없으면 null */
function tomorrowText(items: ScheduleItem[], dayIndex: number): string | null {
  const first = dayPlaces(items, dayIndex + 1)[0];
  if (!first) return null;
  const t = hhmm(first);
  return `내일 첫 일정 · day ${dayIndex + 2} ${itemName(first)}${t ? ` ${t}` : ""}`;
}

/**
 * 오늘 카드. 다음 장소 = 들른 개수(visited) 다음 일정이되, 시각이 지난 일정이 있으면 적어도 그 자리부터.
 * 「이후」 는 그다음 두 곳
 */
export function todayPlan(
  items: ScheduleItem[],
  dayIndex: number,
  visited: number,
  now: string | null,
): TodayPlan {
  const places = dayPlaces(items, dayIndex);
  if (places.length === 0) return { kind: "free" };
  const index = Math.max(visited, timeFloor(places, now));
  if (index >= places.length)
    return { kind: "done", tomorrow: tomorrowText(items, dayIndex), last: places.length - 1 };
  const nums = placeNumbers(
    items.filter((i) => i.day_index === dayIndex).sort((a, b) => a.position - b.position),
  );
  const place = places[index];
  return {
    kind: "next",
    index,
    label: nextLabel(place, index),
    place: lineOf(place, nums, [categoryOf(place), place.description].filter(Boolean).join(" · ")),
    after: places
      .slice(index + 1, index + 3)
      .map((p) =>
        lineOf(p, nums, [hhmm(p) ?? "시간 없음", categoryOf(p)].filter(Boolean).join(" · ")),
      ),
  };
}
