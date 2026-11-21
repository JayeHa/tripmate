import { describe, expect, it } from "vitest";

import { autoMoveMinutes, segmentTravelMode } from "./directions";
import { directionsUrl } from "./distance";
import { flightSegment, placeSegment } from "./route";

const TOKYO_STATION = { lat: 35.6812, lng: 139.7671 };
const SKYTREE = { lat: 35.7101, lng: 139.8107 };
const NEAR = { lat: 35.6842, lng: 139.7701 };

describe("segmentTravelMode", () => {
  it("고른 수단이 먼저 — 지하철 · 버스 · 기차 = 대중교통, 택시 = 운전, 도보 = 도보", () => {
    const of = (mode: "subway" | "bus" | "train" | "taxi" | "walk") =>
      segmentTravelMode(placeSegment(TOKYO_STATION, SKYTREE, null, { mode, detail: null }));
    expect([of("subway"), of("bus"), of("train"), of("taxi"), of("walk")]).toEqual([
      "transit",
      "transit",
      "transit",
      "driving",
      "walking",
    ]);
  });

  it("고르지 않았으면 추정 — 가까우면 도보, 멀면 대중교통", () => {
    expect(segmentTravelMode(placeSegment(TOKYO_STATION, NEAR, null))).toBe("walking");
    expect(segmentTravelMode(placeSegment(TOKYO_STATION, SKYTREE, null))).toBe("transit");
  });

  it("항공 · 좌표 없는 구간은 길찾기가 없다", () => {
    const flight = flightSegment({
      dep_date: "2026-10-31",
      dep_time: "07:15",
      arr_date: "2026-10-31",
      arr_time: "09:40",
    });
    expect(segmentTravelMode(flight)).toBeNull();
    expect(segmentTravelMode(placeSegment(null, SKYTREE, null))).toBeNull();
    expect(
      segmentTravelMode(
        placeSegment(TOKYO_STATION, SKYTREE, null, { mode: "flight", detail: null }),
      ),
    ).toBeNull();
  });
});

describe("autoMoveMinutes", () => {
  it("고른 수단의 식으로 센다 — 수단이 없으면 추정", () => {
    expect(autoMoveMinutes(TOKYO_STATION, SKYTREE, null)).toBe(20);
    expect(autoMoveMinutes(TOKYO_STATION, SKYTREE, "walk")).toBe(66);
  });
});

describe("directionsUrl", () => {
  it("출발 · 도착 좌표와 수단을 넣는다", () => {
    const url = new URL(directionsUrl(TOKYO_STATION, SKYTREE, "driving"));
    expect(url.searchParams.get("travelmode")).toBe("driving");
    expect(url.searchParams.get("origin")).toBe("35.6812,139.7671");
    expect(url.searchParams.get("destination")).toBe("35.7101,139.8107");
  });
});
