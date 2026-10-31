import type { ScheduleItem } from "../model/types";

/**
 * 하루의 진행 — 오늘 어디까지 다녀왔는지. 홈 「오늘」 카드의 다음 장소와 일정 화면의 「다녀온 일정」(회색)이 같은 기준을 쓴다.
 * 다음 장소 = 「들렀어요」 로 넘긴 수(기기별) 다음 장소이되, 시각이 지난 장소가 있으면 적어도 그 자리부터
 */

/** 그날의 장소 일정(대체 장소 · 메모 · 항공편은 빼고), 순서대로 */
export function dayPlaces(items: readonly ScheduleItem[], dayIndex: number): ScheduleItem[] {
  return items
    .filter((i) => i.day_index === dayIndex && i.kind === "place" && i.alternative_of === null)
    .sort((a, b) => a.position - b.position);
}

/** 「HH:mm」 — 시간이 없으면 null */
export function itemHHmm(item: ScheduleItem): string | null {
  return item.start_time?.slice(0, 5) ?? null;
}

/**
 * 시각이 지난 마지막 장소의 자리 — 그 앞의 시간 없는 장소는 지나간 것으로 본다. 없으면 0.
 * now 가 null 이면(오늘이 아닌 날을 미리 볼 때) 시각으로 건너뛰지 않는다
 */
function timeFloor(places: ScheduleItem[], now: string | null): number {
  if (!now) return 0;
  return places.reduce((floor, p, i) => {
    const t = itemHHmm(p);
    return t && t <= now ? i : floor;
  }, 0);
}

/**
 * 그날 다음 장소의 자리(dayPlaces 의 순번). 장소 수와 같으면 다 마쳤다.
 * visited = 「들렀어요」 로 넘긴 수, now = 지금 「HH:mm」(오늘이 아니면 null)
 */
export function nextPlaceIndex(
  items: readonly ScheduleItem[],
  dayIndex: number,
  visited: number,
  now: string | null,
): number {
  const places = dayPlaces(items, dayIndex);
  return Math.min(Math.max(visited, timeFloor(places, now)), places.length);
}

/**
 * 다녀온 일정 — 오늘 앞의 날은 모두, 오늘은 다음 장소보다 앞에 있는 줄(항공편 · 메모 카드 포함, 다 마쳤으면 그날 모두).
 * 대체 장소는 원래 일정을 따른다. 다음 장소의 id 도 함께 돌려준다(다 마쳤으면 null) — 일정 화면이 들어갈 때 그 줄로 간다
 */
export function dayProgress(
  items: readonly ScheduleItem[],
  todayIndex: number,
  visited: number,
  now: string | null,
): { past: Set<string>; nextId: string | null } {
  const places = dayPlaces(items, todayIndex);
  const next = places[nextPlaceIndex(items, todayIndex, visited, now)] ?? null;
  const before = (i: ScheduleItem) =>
    i.day_index < todayIndex ||
    (i.day_index === todayIndex && (next === null || i.position < next.position));
  const main = items.filter((i) => i.alternative_of === null && before(i));
  const past = new Set(main.map((i) => i.id));
  for (const alt of items) {
    if (alt.alternative_of !== null && past.has(alt.alternative_of)) past.add(alt.id);
  }
  return { past, nextId: next?.id ?? null };
}
