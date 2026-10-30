import { walkLabel } from "@/entities/schedule-item";

import type { GuideCard } from "./guide";

export type LatLng = { lat: number; lng: number };

/** 지도 위 핀 하나 — 카드 · 번호(지금 필터 · 정렬 결과에서 좌표 있는 것의 순서) · 좌표 */
export type GuidePin = { card: GuideCard; num: number; at: LatLng };

/**
 * 필터 · 정렬을 건 카드를 지도 핀으로. 좌표가 없는 장소는 빼고 그 수를 따로 센다(「위치 없는 N곳은 목록에서」).
 * 번호는 핀에 붙는 1부터의 순서 — 목록 줄의 번호와 같다
 */
export function guidePins(cards: readonly GuideCard[]): { pins: GuidePin[]; noLocation: number } {
  const pins: GuidePin[] = [];
  for (const card of cards) {
    const { lat, lng } = card.place;
    if (lat !== null && lng !== null) pins.push({ card, num: pins.length + 1, at: { lat, lng } });
  }
  return { pins, noLocation: cards.length - pins.length };
}

/** 두 점 사이 직선거리(m) — 위도에 맞춘 평면 근사. 도시 안의 거리라 충분하다 */
export function distanceM(a: LatLng, b: LatLng): number {
  const x = (b.lng - a.lng) * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  return 111_320 * Math.hypot(b.lat - a.lat, x);
}

/** 가운데 값(짝수면 위쪽 가운데). 빈 배열은 부르지 않는다 */
function median(values: number[]): number {
  const sorted = values.toSorted((x, y) => x - y);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * 첫 화면에 담을 점 — 좌표 가운데 값에서 radius 안의 점만. 멀리 떨어진 곳(카와고에 · 나리타 공항)이
 * 도심 핀을 작게 만들지 않게 한다. 안에 든 점이 없으면 전부
 */
export function corePoints(points: readonly LatLng[], radiusM = 12_000): LatLng[] {
  if (points.length === 0) return [];
  const center = { lat: median(points.map((p) => p.lat)), lng: median(points.map((p) => p.lng)) };
  const core = points.filter((p) => distanceM(center, p) <= radiusM);
  return core.length > 0 ? core : [...points];
}

/** 구글맵 길찾기 주소(목적지만 — 출발은 지금 위치). 구글 장소 id 가 있으면 함께 넘긴다 */
export function directionsUrl(at: LatLng, googlePlaceId: string | null): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${at.lat},${at.lng}`);
  if (googlePlaceId) url.searchParams.set("destination_place_id", googlePlaceId);
  return url.toString();
}

/** 모바일 지도 시트의 높이 — 지도 칸의 절반, 최대 300 */
export function sheetHeight(mapHeight: number): number {
  return Math.min(300, Math.round(mapHeight * 0.5));
}

export type MapPadding = { top: number; right: number; bottom: number; left: number };

/**
 * 지도에서 시트 · 패널에 가리지 않는 칸 — 핀을 맞추거나 고른 핀을 옮길 때 이 안에 둔다.
 * 모바일은 아래 시트가 덮는 높이(sheetCover)만큼, PC 는 왼쪽 패널(16 + 380 + 여유)만큼 비운다
 */
export function mapPadding(layout: "mobile" | "pc", sheetCover: number): MapPadding {
  if (layout === "pc") return { top: 40, right: 40, bottom: 40, left: 420 };
  return { top: 24, right: 24, bottom: sheetCover + 24, left: 24 };
}

/** 가리지 않는 칸의 가운데가 지도 가운데에서 떨어진 만큼(px) — panBy 에 그대로 넘기면 지도 가운데의 점이 그 칸 가운데로 간다 */
export function freeCenterOffset(p: MapPadding): [number, number] {
  return [(p.right - p.left) / 2, (p.bottom - p.top) / 2];
}

/** 모바일 지도 시트 단계 — 접힘(제목 줄만) · 반 · 펼침(지도 칸 전체) */
export type SheetStage = "peek" | "half" | "full";

/** 접힌 시트 높이 — 핸들 24 + 제목 줄 40 */
export const PEEK_HEIGHT = 64;

/** 단계의 시트 높이 */
export function stageHeight(stage: SheetStage, mapHeight: number): number {
  if (stage === "peek") return PEEK_HEIGHT;
  if (stage === "full") return mapHeight;
  return sheetHeight(mapHeight);
}

/** 끌기를 놓은 높이에서 가장 가까운 단계 */
export function nearestStage(height: number, mapHeight: number): SheetStage {
  const stages: SheetStage[] = ["peek", "half", "full"];
  return stages.reduce((best, s) =>
    Math.abs(stageHeight(s, mapHeight) - height) < Math.abs(stageHeight(best, mapHeight) - height)
      ? s
      : best,
  );
}

/** 핸들을 눌렀을 때 다음 단계 — 접힘 → 반 → 펼침 → 반 */
export function nextStage(stage: SheetStage): SheetStage {
  return stage === "half" ? "full" : "half";
}

/** 고른 핀에서 가까운 다른 핀 n곳(가까운 순)과 거리 글자 */
export function nearbyPins(
  pins: readonly GuidePin[],
  selected: GuidePin,
  n = 3,
): { pin: GuidePin; label: string }[] {
  return pins
    .filter((p) => p !== selected)
    .map((pin) => ({ pin, m: distanceM(selected.at, pin.at) }))
    .toSorted((a, b) => a.m - b.m)
    .slice(0, n)
    .map(({ pin, m }) => ({ pin, label: walkLabel(m / 1000) }));
}
