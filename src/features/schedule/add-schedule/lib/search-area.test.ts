import { describe, expect, it } from "vitest";

import type { City } from "@/entities/city";

import { defaultCityId, searchArea } from "./search-area";

const city = (id: string, lat: number, lng: number, zoom = 11, country_code = "JP") =>
  ({ id, lat, lng, zoom, country_code }) as City;
const TOKYO = city("tokyo", 35.6812, 139.7671);
const OSAKA = city("osaka", 34.6937, 135.5023);
// 0006 시드의 나라 · 섬 무리 단위 도시
const HAWAII = city("hawaii", 20.8, -156.33, 9, "US");
const KOREA = city("domestic-anywhere", 36.5, 127.8, 7, "KR");

describe("searchArea", () => {
  it("여행 도시의 나라로 제한하고, 중심에서 ±1° 사각형 안만 찾는다", () => {
    expect(searchArea(TOKYO)).toEqual({
      includedRegionCodes: ["jp"],
      locationRestriction: { north: 36.6812, south: 34.6812, east: 140.7671, west: 138.7671 },
    });
  });

  it("도쿄 사각형에 하코네는 들어오고 오사카는 빠진다", () => {
    const r = searchArea(TOKYO).locationRestriction;
    if (!r) throw new Error("도시 단위는 사각형이 있어야 한다");
    const inside = (p: { lat: number; lng: number }) =>
      p.lat <= r.north && p.lat >= r.south && p.lng <= r.east && p.lng >= r.west;
    expect(inside({ lat: 35.2324, lng: 139.1069 })).toBe(true);
    expect(inside(OSAKA)).toBe(false);
  });

  it("줌 10 은 ±2°, 줌 9 이하(나라 · 섬 무리)는 사각형 없이 나라 제한 + 중심 bias", () => {
    expect(searchArea(city("x", 10, 100, 10)).locationRestriction).toMatchObject({
      north: 12,
      west: 98,
    });
    // 하와이 사각형 ±1° 였다면 빅아일랜드(19.6, -155.5) · 카우아이(22.1, -159.5)가 빠졌다
    expect(searchArea(HAWAII)).toEqual({
      includedRegionCodes: ["us"],
      locationBias: { center: { lat: 20.8, lng: -156.33 }, radius: 50_000 },
    });
    // 「국내 어디론가」: 서울 · 부산 · 제주가 모두 들어와야 한다
    expect(searchArea(KOREA)).not.toHaveProperty("locationRestriction");
    expect(searchArea(KOREA).includedRegionCodes).toEqual(["kr"]);
  });
});

describe("defaultCityId", () => {
  it("그날 첫 장소에서 가장 가까운 도시", () => {
    expect(defaultCityId([TOKYO, OSAKA], { lat: 34.67, lng: 135.5 })).toBe("osaka");
  });

  it("그날 장소가 없으면 첫 도시, 도시가 없으면 null", () => {
    expect(defaultCityId([TOKYO, OSAKA], null)).toBe("tokyo");
    expect(defaultCityId([], null)).toBeNull();
  });
});
