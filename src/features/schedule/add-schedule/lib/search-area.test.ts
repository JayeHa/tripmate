import { describe, expect, it } from "vitest";

import type { City } from "@/entities/city";

import { defaultCityId, searchArea } from "./search-area";

const city = (id: string, lat: number, lng: number) =>
  ({ id, lat, lng, country_code: "JP" }) as City;
const TOKYO = city("tokyo", 35.6812, 139.7671);
const OSAKA = city("osaka", 34.6937, 135.5023);

describe("searchArea", () => {
  it("여행 도시의 나라로 제한하고, 중심에서 ±1° 사각형 안만 찾는다", () => {
    expect(searchArea(TOKYO)).toEqual({
      includedRegionCodes: ["jp"],
      locationRestriction: { north: 36.6812, south: 34.6812, east: 140.7671, west: 138.7671 },
    });
  });

  it("도쿄 사각형에 하코네는 들어오고 오사카는 빠진다", () => {
    const { locationRestriction: r } = searchArea(TOKYO);
    const inside = (p: { lat: number; lng: number }) =>
      p.lat <= r.north && p.lat >= r.south && p.lng <= r.east && p.lng >= r.west;
    expect(inside({ lat: 35.2324, lng: 139.1069 })).toBe(true);
    expect(inside(OSAKA)).toBe(false);
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
