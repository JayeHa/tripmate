import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "../model/types";
import { buildRouteDay } from "./route-day";
import type { TimelineLeg, TimelineRow } from "./timeline";

type LatLng = { lat: number; lng: number };

const TOKYO_STATION = { lat: 35.6812, lng: 139.7671 };
/** 스카이트리 — 도쿄역에서 약 5.1km */
const SKYTREE = { lat: 35.7101, lng: 139.8107 };

type RowPatch = Partial<Omit<TimelineRow, "item">> & {
  id: string;
  at?: LatLng;
  flightId?: string;
};

/** 노선도에 필요한 칸만 채운 타임라인 줄. at 이 있으면 장소 좌표 */
function row({ id, at, flightId, ...patch }: RowPatch): TimelineRow {
  const item = {
    id,
    flight_id: flightId ?? null,
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

/** fromItemId 에서 오는 길(이동 방법 창을 열 수 있는 쌍) */
function legFrom(fromItemId: string, mode: TimelineLeg["mode"] = null): TimelineLeg {
  return {
    label: "",
    url: "",
    fromItemId,
    fromName: "",
    mode,
    modeLabel: null,
    detail: mode ? "긴자행" : null,
    hasMove: mode !== null,
  };
}

describe("buildRouteDay", () => {
  it("날짜 메모는 바로 앞 역 아래, 첫 역 앞이면 day 머리로", () => {
    const day = buildRouteDay([
      row({ id: "n0", kind: "note" }),
      row({ id: "a", at: TOKYO_STATION }),
      row({ id: "n1", kind: "note" }),
      row({ id: "b", at: SKYTREE, leg: legFrom("a") }),
    ]);
    expect(day.preNotes.map((n) => n.item.id)).toEqual(["n0"]);
    expect(day.stops.map((s) => s.row.item.id)).toEqual(["a", "b"]);
    expect(day.stops[0].notes.map((n) => n.item.id)).toEqual(["n1"]);
  });

  it("역 종류 — 숙소 · 공항 · 항공편은 굵은 링, 임시는 점선", () => {
    const day = buildRouteDay([
      row({ id: "s", category: "stay" }),
      row({ id: "air", category: "air" }),
      row({ id: "f", kind: "flight" }),
      row({ id: "o", status: "opt" }),
      row({ id: "p", category: "food", status: "ok" }),
    ]);
    expect(day.stops.map((s) => s.kind)).toEqual(["hub", "hub", "hub", "opt", "place"]);
  });

  it("장소 → 장소 구간은 다음 줄에 적은 이동 방법(이 역에서 올 때만), 없으면 추정", () => {
    const day = buildRouteDay([
      row({ id: "a", at: TOKYO_STATION }),
      row({ id: "b", at: SKYTREE, time: "10:00", leg: legFrom("a", "bus") }),
      row({ id: "c", at: TOKYO_STATION, time: "12:00", leg: legFrom("b") }),
    ]);
    const [ab, bc, last] = day.stops;
    expect(ab.seg).toMatchObject({ mode: "transit", icon: "🚌", estimated: false });
    expect(ab).toMatchObject({ editable: true });
    expect(ab.next?.item.id).toBe("b");
    expect(bc.seg).toMatchObject({ mode: "transit", estimated: true, depTime: "11:40" });
    expect(last).toMatchObject({ seg: null, next: null, editable: false });
  });

  it("항공편 역은 편명 시각으로, 편명을 모르거나 좌표가 없으면 칩 없는 선", () => {
    const flightOf = (id: string) =>
      id === "f1"
        ? { dep_date: "2026-10-31", dep_time: "07:15", arr_date: "2026-10-31", arr_time: "09:40" }
        : null;
    const day = buildRouteDay(
      [
        row({ id: "a", at: TOKYO_STATION }),
        row({ id: "f", kind: "flight", flightId: "f1" }),
        row({ id: "g", kind: "flight", flightId: "f2" }),
        row({ id: "b", at: SKYTREE, leg: legFrom("a", "subway") }),
      ],
      flightOf,
    );
    const [toFlight, flight, unknown] = day.stops;
    expect(toFlight.seg?.mode).toBe("none");
    expect(toFlight.editable).toBe(false);
    expect(flight.seg).toMatchObject({ mode: "flight", minutes: 145, depTime: "07:15" });
    expect(unknown.seg?.mode).toBe("none");
    // b 의 leg 는 a 에서 오는 길이라 항공편 → b 구간에는 쓰지 않는다
    expect(unknown.editable).toBe(false);
  });

  it("요약 칩 — 구간 분의 합과 장소 수(항공편은 세지 않는다)", () => {
    const day = buildRouteDay([
      row({ id: "a", at: TOKYO_STATION }),
      row({ id: "b", at: SKYTREE, leg: legFrom("a") }),
      row({ id: "f", kind: "flight" }),
    ]);
    expect(day.totals).toEqual({ transit: 20, walk: 0, places: 2 });
  });
});
