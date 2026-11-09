import { itemCoords } from "../model/place";
import { flightSegment, placeSegment, type RouteSegment, routeTotals } from "./route";
import type { TimelineRow } from "./timeline";

/** 역 종류 — 일반 장소 · 숙소 · 공항 · 항공편(환승역처럼 굵게) · 임시(점선) */
export type StopKind = "place" | "hub" | "opt";

/** 항공편 구간을 셀 때 쓰는 편명 시각 */
export type FlightTimes = {
  dep_date: string;
  dep_time: string;
  arr_date: string;
  arr_time: string;
};

/** 노선도의 역 하나 */
export type RouteStopData = {
  row: TimelineRow;
  kind: StopKind;
  /** 이 역 뒤에 둔 날짜 메모 — 역 아래에 늘 보인다 */
  notes: TimelineRow[];
  /** 다음 역까지의 구간. 마지막 역은 null */
  seg: RouteSegment | null;
  /** 다음 역의 줄 — 이동 칩을 누르면 그 줄로 이동 방법 창을 연다 */
  next: TimelineRow | null;
  /** 이동 방법을 적을 수 있는 구간인가(두 장소가 50m 넘게 떨어진 장소 → 장소) */
  editable: boolean;
};

/** 하루 노선도 */
export type RouteDay = {
  /** 첫 역보다 앞에 둔 날짜 메모 — day 머리 아래 「📌」 */
  preNotes: TimelineRow[];
  stops: RouteStopData[];
  /** 요약 칩 — 대중교통 · 도보 분의 합과 장소 수 */
  totals: { transit: number; walk: number; places: number };
};

/** 숙소 · 공항 · 항공편은 환승역처럼 굵은 잉크 링, 임시는 점선, 그 밖은 파란 링 */
function stopKindOf(row: TimelineRow): StopKind {
  if (row.kind === "flight" || row.stay || row.category === "stay" || row.category === "air") {
    return "hub";
  }
  return row.status === "opt" ? "opt" : "place";
}

/**
 * 역 → 다음 역 구간. 항공편 역은 편명 시각으로 비행 시간을 세고(편명을 모르면 칩 없는 선),
 * 장소 → 장소는 적은 이동 방법(다음 줄의 leg 가 이 역에서 올 때만) 또는 직선거리 추정이다
 */
function segmentOf(
  row: TimelineRow,
  next: TimelineRow,
  flightOf: (id: string) => FlightTimes | null,
): RouteSegment {
  if (row.kind === "flight") {
    const flight = row.item.flight_id ? flightOf(row.item.flight_id) : null;
    return flight ? flightSegment(flight) : placeSegment(null, null, null);
  }
  const leg = next.leg?.fromItemId === row.item.id ? next.leg : null;
  return placeSegment(
    itemCoords(row.item),
    itemCoords(next.item),
    next.time,
    leg && { mode: leg.mode, detail: leg.detail },
  );
}

/**
 * 하루치 타임라인 줄 → 노선도. 장소 · 항공편이 역이고, 날짜 메모는 바로 앞 역 아래(첫 역 앞이면 day 머리)에 둔다.
 * flightOf 는 항공편 카드(flight_id)의 편명 시각 — 항공편 목록을 읽기 전이면 null 을 돌려준다
 */
export function buildRouteDay(
  rows: readonly TimelineRow[],
  flightOf: (id: string) => FlightTimes | null = () => null,
): RouteDay {
  const preNotes: TimelineRow[] = [];
  const stops: RouteStopData[] = [];
  for (const row of rows) {
    const last = stops.at(-1);
    if (row.kind === "note") {
      (last ? last.notes : preNotes).push(row);
      continue;
    }
    stops.push({ row, kind: stopKindOf(row), notes: [], seg: null, next: null, editable: false });
  }
  stops.forEach((stop, i) => {
    const next = stops[i + 1]?.row ?? null;
    if (!next) return;
    stop.next = next;
    stop.seg = segmentOf(stop.row, next, flightOf);
    stop.editable = next.leg?.fromItemId === stop.row.item.id;
  });
  const places = stops.filter((s) => s.row.kind === "place").length;
  return { preNotes, stops, totals: { ...routeTotals(stops.map((s) => s.seg)), places } };
}
