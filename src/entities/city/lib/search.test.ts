import { describe, expect, it } from "vitest";
import type { City, CityRegion } from "../model/types";
import { cityAreasLabel, groupByRegion, searchCities } from "./search";

const city = (id: string, name: string, areas: string[], extra: Partial<City> = {}): City => ({
  id,
  scope: "abroad",
  region_id: "japan",
  name,
  areas,
  description: null,
  position: 0,
  lat: 0,
  lng: 0,
  zoom: 11,
  country_code: "JP",
  currency: "JPY",
  timezone: "Asia/Tokyo",
  ...extra,
});

const tokyo = city("tokyo", "도쿄", ["도쿄", "하코네", "요코하마"]);
const bangkok = city("bangkok", "방콕", ["방콕", "코 사멧"], { region_id: "southeast-asia" });
const jeju = city("jeju", "제주", ["제주"], { scope: "domestic", region_id: null });
const anywhere = city("domestic-anywhere", "국내", [], {
  scope: "domestic",
  region_id: null,
  description: "어디론가 떠나고 싶을 때",
});
const all = [tokyo, bangkok, jeju, anywhere];

const regions: CityRegion[] = [
  { id: "japan", name: "일본", position: 0 },
  { id: "southeast-asia", name: "동남아시아", position: 1 },
  { id: "europe", name: "유럽", position: 2 },
];

describe("searchCities", () => {
  it("포함 지역으로도 찾는다", () => {
    expect(searchCities(all, "하코네").map((c) => c.id)).toEqual(["tokyo"]);
  });

  it("공백을 무시한다", () => {
    expect(searchCities(all, "코사멧").map((c) => c.id)).toEqual(["bangkok"]);
  });

  it("빈 검색어면 전부", () => {
    expect(searchCities(all, "  ")).toHaveLength(4);
  });
});

describe("groupByRegion", () => {
  it("해외는 권역 순서대로, 도시 없는 권역은 뺀다", () => {
    const groups = groupByRegion(regions, all, "abroad");
    expect(groups.map((g) => g.region?.id)).toEqual(["japan", "southeast-asia"]);
  });

  it("국내는 권역 없이 한 묶음", () => {
    const groups = groupByRegion(regions, all, "domestic");
    expect(groups).toHaveLength(1);
    expect(groups[0].region).toBeNull();
    expect(groups[0].cities.map((c) => c.id)).toEqual(["jeju", "domestic-anywhere"]);
  });
});

describe("cityAreasLabel", () => {
  it("포함 지역을 쉼표로 잇는다", () => {
    expect(cityAreasLabel(tokyo)).toBe("도쿄, 하코네, 요코하마");
  });

  it("설명이 있으면 설명을 쓴다", () => {
    expect(cityAreasLabel(anywhere)).toBe("어디론가 떠나고 싶을 때");
  });
});
