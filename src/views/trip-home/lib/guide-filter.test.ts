import { describe, expect, it } from "vitest";

import type { CityArea } from "@/entities/city";
import type { Place } from "@/entities/schedule-item";

import type { GuideCard } from "./guide";
import {
  filterGuideCards,
  GUIDE_FILTERS_DEFAULT,
  guideAreaOptions,
  guideFilteredEmptyText,
  type GuideFilters,
  guideTypeOptions,
  hasGuideFilter,
} from "./guide-filter";

/** 테스트용 카드 — 이름 · 별점 · 일정에 넣은 날 · 지역 · 종류(음식점) */
function card(
  name: string,
  rating: number | null,
  day: number | null,
  area: string | null = null,
  subtype: string | null = null,
): GuideCard {
  return {
    place: { id: name, name, rating, area_id: area, category: "food", subtype } as Place,
    addedBy: null,
    memo: null,
    addedAt: "2026-10-30T00:00:00Z",
    day,
    emoji: null,
    inSchedule: day !== null,
    area: null,
  };
}

/** 지역 목록 한 줄 */
function area(id: string, name: string): CityArea {
  return { id, name, city_id: "tokyo", position: 0, lat: 0, lng: 0, radius_m: 1 };
}

const CARDS = [
  card("a", 4.1, null, "shibuya"),
  card("b", null, 0),
  card("c", 4.6, 2, "ginza"),
  card("d", 4.1, null, "shibuya"),
];
const names = (cards: GuideCard[]) => cards.map((c) => c.place.name);
const f = (patch: Partial<GuideFilters>) => ({ ...GUIDE_FILTERS_DEFAULT, ...patch });

describe("filterGuideCards", () => {
  it("추천순 · 전체는 보관함 순서 그대로", () => {
    expect(names(filterGuideCards(CARDS, GUIDE_FILTERS_DEFAULT))).toEqual(["a", "b", "c", "d"]);
  });

  it("평점순은 높은 것부터, 별점 없으면 뒤로, 같으면 보관함 순서", () => {
    expect(names(filterGuideCards(CARDS, f({ sort: "rating" })))).toEqual(["c", "a", "d", "b"]);
  });

  it("일정에 있음 · 아직 안 넣음 — 일정에 넣은 날이 있는지로 가른다", () => {
    expect(names(filterGuideCards(CARDS, f({ status: "in" })))).toEqual(["b", "c"]);
    expect(names(filterGuideCards(CARDS, f({ sort: "rating", status: "out" })))).toEqual([
      "a",
      "d",
    ]);
  });

  it("지역 — 고른 지역, 「기타」 는 지역 없는 곳", () => {
    expect(names(filterGuideCards(CARDS, f({ area: "shibuya" })))).toEqual(["a", "d"]);
    expect(names(filterGuideCards(CARDS, f({ area: "none" })))).toEqual(["b"]);
  });
});

describe("메뉴 · 종류", () => {
  const FOOD = [
    card("ramen1", null, null, null, "ramen"),
    card("sushi1", null, null, null, "sushi"),
    card("ramen2", null, null, null, "ramen"),
    card("etc", null, null),
  ];

  it("고른 종류만, 「기타」 는 종류 없는 곳", () => {
    expect(names(filterGuideCards(FOOD, f({ type: "ramen" })))).toEqual(["ramen1", "ramen2"]);
    expect(names(filterGuideCards(FOOD, f({ type: "none" })))).toEqual(["etc"]);
  });

  it("옵션은 목록 순서대로 개수와 함께, 기타는 끝 — 관광지 · 한 종류뿐이면 숨긴다", () => {
    expect(guideTypeOptions(FOOD, "food")).toEqual([
      { value: "sushi", label: "🍣 스시 1" },
      { value: "ramen", label: "🍜 라멘 · 면 2" },
      { value: "none", label: "기타 1" },
    ]);
    expect(guideTypeOptions(FOOD, "sight")).toEqual([]);
    expect(guideTypeOptions(FOOD.slice(0, 1), "food")).toEqual([]);
  });
});

describe("guideAreaOptions", () => {
  const AREAS = [area("ginza", "긴자"), area("ikebukuro", "이케부쿠로"), area("shibuya", "시부야")];

  it("카드가 있는 지역만 목록 순서대로 개수와 함께, 지역 없는 카드는 끝에 「기타」", () => {
    expect(guideAreaOptions(CARDS, AREAS)).toEqual([
      { value: "ginza", label: "긴자 1" },
      { value: "shibuya", label: "시부야 2" },
      { value: "none", label: "기타 1" },
    ]);
  });

  it("지역 목록이 없으면 빈 배열 — 칩을 숨긴다", () => {
    expect(guideAreaOptions(CARDS, [])).toEqual([]);
  });
});

describe("hasGuideFilter · guideFilteredEmptyText", () => {
  it("정렬은 필터로 치지 않는다", () => {
    expect(hasGuideFilter(f({ sort: "rating" }))).toBe(false);
    expect(hasGuideFilter(f({ status: "out" }))).toBe(true);
    expect(hasGuideFilter(f({ area: "ginza" }))).toBe(true);
  });

  it("일정 포함 여부에 맞는 안내", () => {
    expect(guideFilteredEmptyText("out")).toBe("모든 장소가 일정에 들어갔어요.");
    expect(guideFilteredEmptyText("in")).toBe("아직 일정에 넣은 곳이 없어요.");
  });
});
