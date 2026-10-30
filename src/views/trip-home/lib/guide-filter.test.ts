import { describe, expect, it } from "vitest";

import type { Place } from "@/entities/schedule-item";

import type { GuideCard } from "./guide";
import {
  filterGuideCards,
  GUIDE_FILTERS_DEFAULT,
  guideFilteredEmptyText,
  hasGuideFilter,
} from "./guide-filter";

/** 테스트용 카드 — 이름 · 별점 · 일정에 넣은 날 */
function card(name: string, rating: number | null, day: number | null): GuideCard {
  return {
    place: { id: name, name, rating } as Place,
    addedBy: null,
    memo: null,
    addedAt: "2026-10-30T00:00:00Z",
    day,
    emoji: null,
    inSchedule: day !== null,
  };
}

const CARDS = [card("a", 4.1, null), card("b", null, 0), card("c", 4.6, 2), card("d", 4.1, null)];
const names = (cards: GuideCard[]) => cards.map((c) => c.place.name);

describe("filterGuideCards", () => {
  it("추천순 · 전체는 보관함 순서 그대로", () => {
    expect(names(filterGuideCards(CARDS, GUIDE_FILTERS_DEFAULT))).toEqual(["a", "b", "c", "d"]);
  });

  it("평점순은 높은 것부터, 별점 없으면 뒤로, 같으면 보관함 순서", () => {
    expect(names(filterGuideCards(CARDS, { sort: "rating", status: "all" }))).toEqual([
      "c",
      "a",
      "d",
      "b",
    ]);
  });

  it("일정에 있음 · 아직 안 넣음 — 일정에 넣은 날이 있는지로 가른다", () => {
    expect(names(filterGuideCards(CARDS, { sort: "rec", status: "in" }))).toEqual(["b", "c"]);
    expect(names(filterGuideCards(CARDS, { sort: "rating", status: "out" }))).toEqual(["a", "d"]);
  });
});

describe("hasGuideFilter · guideFilteredEmptyText", () => {
  it("정렬은 필터로 치지 않는다", () => {
    expect(hasGuideFilter({ sort: "rating", status: "all" })).toBe(false);
    expect(hasGuideFilter({ sort: "rec", status: "out" })).toBe(true);
  });

  it("일정 포함 여부에 맞는 안내", () => {
    expect(guideFilteredEmptyText("out")).toBe("모든 장소가 일정에 들어갔어요.");
    expect(guideFilteredEmptyText("in")).toBe("아직 일정에 넣은 곳이 없어요.");
  });
});
