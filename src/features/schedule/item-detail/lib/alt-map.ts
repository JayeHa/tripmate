import { haversineKm, itemCoords, type ScheduleItem, walkLabel } from "@/entities/schedule-item";

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
