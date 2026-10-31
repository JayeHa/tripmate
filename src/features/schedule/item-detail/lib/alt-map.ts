import {
  categoryOf,
  haversineKm,
  isMappedPlace,
  itemCoords,
  itemName,
  type PlaceCategory,
  placeNumbers,
  type ScheduleItem,
  walkLabel,
} from "@/entities/schedule-item";

type LatLng = { lat: number; lng: number };

/** 대체 장소 지도의 핀 하나 — 대체 장소 · 글자(A · B …) · 좌표 · 「도보 N분」(지금 장소에서) */
export type AltPin = { alt: ScheduleItem; tag: string; at: LatLng; walk: string };

const TAGS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * 대체 장소 미니 지도의 핀 — 좌표가 있는 대체 장소만 순서대로 A · B · C. 지금 장소의 좌표가 없으면 빈 배열(지도를 그리지 않는다).
 * 거리는 지금 장소에서의 직선거리로 「도보 N분」(walkLabel)
 */
export function altPins(main: ScheduleItem, alternatives: readonly ScheduleItem[]): AltPin[] {
  const current = itemCoords(main);
  if (!current) return [];
  const pins: AltPin[] = [];
  for (const alt of alternatives) {
    const at = itemCoords(alt);
    if (!at) continue;
    pins.push({ alt, tag: TAGS[pins.length] ?? "", at, walk: walkLabel(haversineKm(current, at)) });
  }
  return pins;
}

/** 크게 보기 지도의 앞뒤 일정 핀 — 그날 번호 · 좌표 · 이름표(「직전 · 호텔 몬토레 긴자」) */
export type NeighborPin = {
  id: string;
  at: LatLng;
  num: number;
  category: PlaceCategory | null;
  label: string;
};

/** 이만큼(50m) 가까우면 같은 자리 — 직전 · 직후가 같은 곳(숙소에 들렀다 다시 나감)이면 핀 하나로 묶는다 */
const SAME_SPOT_KM = 0.05;

/** 핀 하나 — 번호가 없으면(좌표 없는 일정) null */
function neighbor(item: ScheduleItem, nums: Map<string, number>, role: string): NeighborPin | null {
  const at = itemCoords(item);
  const num = nums.get(item.id);
  if (!at || num === undefined) return null;
  return { id: item.id, at, num, category: categoryOf(item), label: `${role} · ${itemName(item)}` };
}

/**
 * 지금 일정의 바로 앞 · 뒤 장소(같은 날, 좌표 있는 장소만 — 메모 · 항공편은 건너뛴다). 대체 장소가 동선에 맞는지 보게 한다.
 * items 는 여행의 타임라인 일정(대체 장소 줄 제외). 번호는 일정 화면과 같다(placeNumbers).
 * 앞 · 뒤가 같은 자리면 핀 하나로 「직전 · 직후 · 이름」
 */
export function neighborPins(items: readonly ScheduleItem[], main: ScheduleItem): NeighborPin[] {
  const day = items
    .filter((i) => i.day_index === main.day_index && i.alternative_of === null)
    .sort((a, b) => a.position - b.position);
  const index = day.findIndex((i) => i.id === main.id);
  if (index < 0) return [];
  const nums = placeNumbers(day);
  const before = day.slice(0, index).findLast(isMappedPlace);
  const after = day.slice(index + 1).find(isMappedPlace);
  const prev = before ? neighbor(before, nums, "직전") : null;
  const next = after ? neighbor(after, nums, "직후") : null;
  if (before && prev && next && haversineKm(prev.at, next.at) <= SAME_SPOT_KM) {
    return [{ ...prev, label: `직전 · 직후 · ${itemName(before)}` }];
  }
  return [prev, next].filter((p): p is NeighborPin => p !== null);
}
