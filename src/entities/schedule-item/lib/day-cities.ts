import type { ScheduleItem } from "../model/types";

/** 도시를 보는 데 필요한 칸만 — 장소가 없으면 null */
type WithCity = { place: { city_id: string } | null };

/**
 * 날마다 날씨를 볼 도시 — 그날 일정 장소가 가장 많은 도시(같으면 먼저 나온 장소의 도시).
 * 장소가 없는 날은 전날 도시, 첫날이면 여행의 첫 도시. 여행 도시를 모르면 null
 */
export function dayCities(
  days: readonly (readonly WithCity[])[],
  firstCity: string | null,
): (string | null)[] {
  let prev = firstCity;
  return days.map((items) => {
    const counts = new Map<string, number>();
    for (const { place } of items) {
      if (place) counts.set(place.city_id, (counts.get(place.city_id) ?? 0) + 1);
    }
    let best: string | null = null;
    for (const [city, n] of counts) if (!best || n > counts.get(best)!) best = city;
    prev = best ?? prev;
    return prev;
  });
}

/** 일정을 날마다(0 ~ totalDays-1) 나눈다 — 대체 장소는 빼고, 여행 기간 밖의 날은 버린다 */
export function itemsByDay(items: readonly ScheduleItem[], totalDays: number): ScheduleItem[][] {
  const days: ScheduleItem[][] = Array.from({ length: totalDays }, () => []);
  for (const item of items) {
    if (!item.alternative_of) days[item.day_index]?.push(item);
  }
  return days;
}
