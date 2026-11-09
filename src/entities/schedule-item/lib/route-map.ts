import { itemCoords } from "../model/place";
import { haversineKm } from "./distance";
import type { RouteMode, RouteSegment } from "./route";
import type { RouteDay } from "./route-day";
import type { TimelineRow } from "./timeline";

type LatLng = { lat: number; lng: number };

/** 그날 장소들의 가운데(좌표 중앙값)에서 이보다 멀면 「범위 밖」 — 지도 맞춤에서 빼고 가장자리에 붙인다(공항 · 근교) */
export const OFF_RANGE_KM = 12;

/** 동선 지도의 장소 하나 — 아래 카드 한 장 */
export type RouteMapStop = {
  row: TimelineRow;
  at: LatLng;
  /** 번호(핀 · 카드) */
  num: number;
  /** 이 장소로 들어오는 구간(바로 앞 역의 구간 — 앞이 항공편이면 비행). 그날 첫 역이면 null */
  inSeg: RouteSegment | null;
  /** 그날 첫 역 — 카드에 「🏁 출발」 */
  first: boolean;
  /** 바로 앞 장소의 좌표 — 「길찾기」 출발지. 첫 장소 · 항공편 바로 뒤 장소는 null(지금 위치에서) */
  prevAt: LatLng | null;
};

/** 핀 하나. 같은 자리를 두 번 가면 핀 하나에 「4·13」 */
export type RouteMapPin = {
  key: string;
  at: LatLng;
  label: string;
  /** 이 핀의 장소 id(앞선 순서). 누르면 첫 id 를 고른다 */
  ids: string[];
  row: TimelineRow;
  /** 범위 밖이면 가운데에서 떨어진 km, 아니면 null */
  offKm: number | null;
};

/** 핀 사이 선 하나 */
export type RouteMapLine = { key: string; from: LatLng; to: LatLng; mode: RouteMode; toId: string };

export type RouteMapData = { stops: RouteMapStop[]; pins: RouteMapPin[]; lines: RouteMapLine[] };

/** 좌표가 같으면 같은 핀 */
function coordKey(at: LatLng): string {
  return `${at.lat},${at.lng}`;
}

/** 중앙값. 짝수면 가운데 둘의 평균 — 두 곳뿐인 날에 가운데가 한쪽 위에 놓이지 않게 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * 장소마다 가운데(위도 · 경도 각각 중앙값)에서의 거리. OFF_RANGE_KM 을 넘으면 범위 밖이다.
 * 모두 범위 밖이면(멀리 흩어진 날) 아무것도 빼지 않는다
 */
function offRange(points: LatLng[]): (at: LatLng) => number | null {
  if (points.length === 0) return () => null;
  const center = { lat: median(points.map((p) => p.lat)), lng: median(points.map((p) => p.lng)) };
  const inside = points.some((p) => haversineKm(p, center) <= OFF_RANGE_KM);
  return (at) => {
    const km = haversineKm(at, center);
    return inside && km > OFF_RANGE_KM ? km : null;
  };
}

/**
 * 두 장소 사이 선의 종류. 바로 이어진 역이면 그 구간의 수단, 사이에 다른 역(항공편)이 끼면
 * 항공편이 있을 때만 비행 파선, 아니면 선을 긋지 않는다(null)
 */
function lineMode(route: RouteDay, from: number, to: number): RouteMode | null {
  if (to === from + 1) return route.stops[from].seg?.mode ?? null;
  const between = route.stops.slice(from + 1, to);
  return between.some((s) => s.row.kind === "flight") ? "flight" : null;
}

/**
 * 하루 노선도 → 동선 지도(카드 · 핀 · 선). 번호가 있고 좌표가 있는 장소만 지도에 오른다.
 * 핀은 같은 좌표끼리 합치고, 선은 지도에 오른 장소를 순서대로 잇는다(같은 핀끼리는 잇지 않는다)
 */
export function routeMapOf(route: RouteDay): RouteMapData {
  const stops: RouteMapStop[] = [];
  const indexes: number[] = [];
  route.stops.forEach((stop, i) => {
    const at = itemCoords(stop.row.item);
    if (stop.row.num === null || !at) return;
    stops.push({
      row: stop.row,
      at,
      num: stop.row.num,
      inSeg: route.stops[i - 1]?.seg ?? null,
      first: i === 0,
      // 바로 앞 역이 항공편이면 출발지 없이(지금 위치) — 노선도 역 펼침의 「길찾기」 와 같다
      prevAt: route.stops[i - 1]?.row.kind === "flight" ? null : (stops.at(-1)?.at ?? null),
    });
    indexes.push(i);
  });

  const offKm = offRange(stops.map((s) => s.at));
  const pins = new Map<string, RouteMapPin>();
  for (const stop of stops) {
    const key = coordKey(stop.at);
    const same = pins.get(key);
    if (same) {
      same.label += `·${stop.num}`;
      same.ids.push(stop.row.item.id);
      continue;
    }
    pins.set(key, {
      key,
      at: stop.at,
      label: String(stop.num),
      ids: [stop.row.item.id],
      row: stop.row,
      offKm: offKm(stop.at),
    });
  }

  const lines: RouteMapLine[] = [];
  stops.forEach((stop, k) => {
    const prev = stops[k - 1];
    if (!prev || coordKey(prev.at) === coordKey(stop.at)) return;
    const mode = lineMode(route, indexes[k - 1], indexes[k]);
    if (!mode) return;
    lines.push({
      key: `${prev.row.item.id}-${stop.row.item.id}`,
      from: prev.at,
      to: stop.at,
      mode,
      toId: stop.row.item.id,
    });
  });
  return { stops, pins: [...pins.values()], lines };
}

/** 지도가 지금 보이는 범위와 지도 칸의 크기(px) */
export type MapView = {
  north: number;
  south: number;
  east: number;
  west: number;
  width: number;
  height: number;
};

/** 지도 위를 덮는 칸(px) — 위 단추 · 칩 줄, 아래 카드 시트, 양옆 여백 */
export type MapInset = { top: number; bottom: number; side: number };

/**
 * 좌표를 지도에서 가려지지 않은 칸 안으로 끌어온다(범위 밖 핀을 가장자리에 붙일 때).
 * 화면 px 를 위도 · 경도에 비례로 옮긴다 — 도시 하나 넓이에서는 Mercator 왜곡이 핀 크기보다 작다.
 * 이미 칸 안이면 그대로
 */
export function clampToView(at: LatLng, view: MapView, inset: MapInset): LatLng {
  const latPerPx = (view.north - view.south) / view.height;
  const lngPerPx = (view.east - view.west) / view.width;
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  return {
    lat: clamp(at.lat, view.south + inset.bottom * latPerPx, view.north - inset.top * latPerPx),
    lng: clamp(at.lng, view.west + inset.side * lngPerPx, view.east - inset.side * lngPerPx),
  };
}
