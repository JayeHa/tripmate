import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "../model/types";
import { buildRouteDay } from "./route-day";
import { clampToView, routeMapOf } from "./route-map";
import type { TimelineRow } from "./timeline";

type LatLng = { lat: number; lng: number };

const TOKYO_STATION = { lat: 35.6812, lng: 139.7671 };
/** 스카이트리 — 도쿄역에서 약 5.1km */
const SKYTREE = { lat: 35.7101, lng: 139.8107 };
/** 긴자 — 도쿄역에서 약 1km */
const GINZA = { lat: 35.6717, lng: 139.765 };
/** 나리타 공항 — 도쿄역에서 약 58km(아래 범위 밖 테스트의 가운데에서 약 55km) */
const NARITA = { lat: 35.772, lng: 140.3929 };
/** 오사카역 — 도쿄에서 약 400km */
const OSAKA = { lat: 34.7025, lng: 135.4959 };

type RowPatch = Partial<Omit<TimelineRow, "item">> & { id: string; at?: LatLng };

/** 지도에 필요한 칸만 채운 타임라인 줄. at 이 있으면 장소 좌표 */
function row({ id, at, ...patch }: RowPatch): TimelineRow {
  const item = {
    id,
    flight_id: null,
    place: at ? { lat: at.lat, lng: at.lng } : null,
  } as ScheduleItem;
  return {
    item,
    kind: "place",
    num: null,
    time: null,
    status: null,
    category: null,
    emoji: null,
    meta: null,
    isMeal: false,
    leg: null,
    memos: [],
    hours: null,
    hoursOff: false,
    links: [],
    alternatives: [],
    stay: null,
    ...patch,
  };
}

/** 줄 목록 → 노선도 → 동선 지도 */
function mapOf(rows: TimelineRow[]) {
  return routeMapOf(buildRouteDay(rows));
}

describe("routeMapOf", () => {
  it("같은 자리를 두 번 가면 핀 하나에 「1·3」, 같은 핀끼리는 선을 잇지 않는다", () => {
    const map = mapOf([
      row({ id: "a", num: 1, at: TOKYO_STATION }),
      row({ id: "b", num: 2, at: SKYTREE }),
      row({ id: "c", num: 3, at: TOKYO_STATION }),
      row({ id: "d", num: 4, at: TOKYO_STATION }),
    ]);
    expect(map.stops.map((s) => s.num)).toEqual([1, 2, 3, 4]);
    expect(map.pins.map((p) => [p.label, p.ids])).toEqual([
      ["1·3·4", ["a", "c", "d"]],
      ["2", ["b"]],
    ]);
    expect(map.lines.map((l) => [l.key, l.mode, l.toId])).toEqual([
      ["a-b", "transit", "b"],
      ["b-c", "transit", "c"],
    ]);
  });

  it("카드 — 들어오는 구간 · 첫 역 · 길찾기 출발지", () => {
    const map = mapOf([
      row({ id: "a", num: 1, at: TOKYO_STATION }),
      row({ id: "b", num: 2, at: GINZA }),
    ]);
    const [first, second] = map.stops;
    expect(first).toMatchObject({ first: true, inSeg: null, prevAt: null });
    expect(second).toMatchObject({ first: false, prevAt: TOKYO_STATION });
    expect(second.inSeg?.mode).toBe("walk");
  });

  it("항공편은 핀이 아니고, 항공편을 사이에 둔 두 장소는 비행 파선으로 잇는다", () => {
    const map = mapOf([
      row({ id: "a", num: 1, at: OSAKA }),
      row({ id: "f", kind: "flight" }),
      row({ id: "b", num: 2, at: NARITA }),
      row({ id: "c", kind: "note" }),
      row({ id: "d", num: 3, at: TOKYO_STATION }),
    ]);
    expect(map.pins.map((p) => p.ids[0])).toEqual(["a", "b", "d"]);
    expect(map.lines.map((l) => [l.key, l.mode])).toEqual([
      ["a-b", "flight"],
      ["b-d", "transit"],
    ]);
    // 항공편 바로 뒤 장소의 들어오는 구간은 항공편의 구간
    expect(map.stops[1].inSeg?.mode).toBe("none");
    expect(map.stops[1].first).toBe(false);
    // 착륙 뒤 첫 장소의 길찾기는 출발 도시가 아니라 지금 위치에서
    expect(map.stops[1].prevAt).toBeNull();
    expect(map.stops[2].prevAt).toEqual(NARITA);
  });

  it("좌표 중앙값에서 12km 넘는 곳은 범위 밖(km), 모두 멀면 아무것도 빼지 않는다", () => {
    const tokyo = mapOf([
      row({ id: "n", num: 1, at: NARITA }),
      row({ id: "a", num: 2, at: TOKYO_STATION }),
      row({ id: "b", num: 3, at: SKYTREE }),
      row({ id: "c", num: 4, at: GINZA }),
    ]);
    expect(tokyo.pins.map((p) => p.offKm && Math.round(p.offKm))).toEqual([55, null, null, null]);

    const apart = mapOf([
      row({ id: "o", num: 1, at: OSAKA }),
      row({ id: "n", num: 2, at: NARITA }),
    ]);
    expect(apart.pins.map((p) => p.offKm)).toEqual([null, null]);
  });

  it("번호가 없거나 좌표가 없는 줄은 지도에 오르지 않는다", () => {
    const map = mapOf([row({ id: "a", num: 1 }), row({ id: "b", at: TOKYO_STATION })]);
    expect(map).toEqual({ stops: [], pins: [], lines: [] });
  });
});

describe("clampToView", () => {
  // 위도 1도 = 100px, 경도 1도 = 100px 인 400 × 800 지도
  const view = { north: 10, south: 2, east: 4, west: 0, width: 400, height: 800 };
  const inset = { top: 100, bottom: 300, side: 50 };

  it("가려진 칸 밖이면 보이는 칸의 가장자리로", () => {
    expect(clampToView({ lat: 20, lng: -5 }, view, inset)).toEqual({ lat: 9, lng: 0.5 });
    expect(clampToView({ lat: 0, lng: 9 }, view, inset)).toEqual({ lat: 5, lng: 3.5 });
  });

  it("보이는 칸 안이면 그대로", () => {
    expect(clampToView({ lat: 7, lng: 2 }, view, inset)).toEqual({ lat: 7, lng: 2 });
  });
});
