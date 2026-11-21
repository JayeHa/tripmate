import type { MoveMode } from "../model/move";
import type { GmapTravelMode } from "./distance";
import { placeSegment, type RouteSegment } from "./route";

type LatLng = { lat: number; lng: number };

/** 고른 수단 → 구글맵 travelmode. 항공은 길찾기가 없다 */
const BY_PICKED: Record<MoveMode, GmapTravelMode | null> = {
  subway: "transit",
  bus: "transit",
  train: "transit",
  taxi: "driving",
  walk: "walking",
  flight: null,
};

/**
 * 구간을 구글맵 길찾기로 열 때의 수단 — 고른 수단이 먼저(지하철 · 버스 · 기차 = 대중교통, 택시 = 운전, 도보 = 도보),
 * 고르지 않았으면 추정 수단(도보 구간은 도보, 그 밖은 대중교통). 항공 · 좌표 없는 구간은 길찾기가 없어 null
 */
export function segmentTravelMode(seg: RouteSegment): GmapTravelMode | null {
  if (seg.mode === "none" || seg.mode === "flight") return null;
  if (seg.picked) return BY_PICKED[seg.picked];
  return seg.mode === "walk" ? "walking" : "transit";
}

/** 이동 방법 창의 「자동 N분」 — 고른 수단(없으면 추정)으로 센 분. 시간을 셀 수 없으면 null */
export function autoMoveMinutes(from: LatLng, to: LatLng, mode: MoveMode | null): number | null {
  return placeSegment(from, to, null, { mode, detail: null }).minutes;
}
