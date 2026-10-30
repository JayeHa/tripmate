import { describe, expect, it } from "vitest";

import type { GuidePlace, Place, ScheduleItem } from "@/entities/schedule-item";

import { guideCards, isGuideTab, isLongText, reviewsLabel } from "./guide";

/** 테스트용 장소 */
function place(id: string, category: string | null, emoji: string | null = null): Place {
  return { id, category, emoji, name: id, review_count: null } as Place;
}

/** 보관함 줄 */
function row(p: Place): GuidePlace {
  return { place: p, addedBy: null, memo: null, addedAt: "2026-10-30T00:00:00Z" };
}

/** 일정 줄 */
function item(placeId: string, day: number, extra: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    place_id: placeId,
    day_index: day,
    alternative_of: null,
    emoji: null,
    ...extra,
  } as ScheduleItem;
}

const ROWS = [
  row(place("ramen", "food")),
  row(place("cafe", "cafe", "☕")),
  row(place("tower", "sight")),
  row(place("old", null)),
  row(place("hotel", "stay")),
];

describe("guideCards", () => {
  it("탭의 카테고리만 — 식당은 음식점 + 카페, 빈 카테고리는 관광지, 숙소는 어디에도 없다", () => {
    expect(guideCards(ROWS, [], "food").map((c) => c.place.id)).toEqual(["ramen", "cafe"]);
    expect(guideCards(ROWS, [], "sight").map((c) => c.place.id)).toEqual(["tower", "old"]);
    expect(guideCards(ROWS, [], "rest")).toEqual([]);
  });

  it("일정에 넣은 가장 이른 날을 붙이고, 대체 장소는 넣은 것으로 치지 않는다", () => {
    const items = [item("ramen", 3), item("ramen", 1), item("cafe", 0, { alternative_of: "x" })];
    const cards = guideCards(ROWS, items, "food");
    expect(cards.map((c) => c.day)).toEqual([1, null]);
  });

  it("이모지는 장소 것, 없으면 첫 일정의 것, 그것도 없으면 대체 장소 일정의 것", () => {
    const cards = guideCards(ROWS, [item("ramen", 0, { emoji: "🍜" })], "food");
    expect(cards.map((c) => c.emoji)).toEqual(["🍜", "☕"]);
    const alt = guideCards(ROWS, [item("tower", 0, { alternative_of: "x", emoji: "🗼" })], "sight");
    expect(alt.map((c) => [c.emoji, c.day])).toEqual([
      ["🗼", null],
      [null, null],
    ]);
  });
});

describe("isGuideTab · reviewsLabel", () => {
  it("요약 · 교통은 가이드 탭이 아니다", () => {
    expect(
      ["summary", "sight", "food", "shop", "rest", "transport"].map((t) => isGuideTab(t as never)),
    ).toEqual([false, true, true, true, true, false]);
  });
  it("리뷰 수는 괄호 · 쉼표, 없으면 빈 글자", () => {
    expect(reviewsLabel({ review_count: 5541 })).toBe("(5,541)");
    expect(reviewsLabel({ review_count: null })).toBe("");
  });
});

describe("isLongText", () => {
  it("네 줄 이상이거나 90자를 넘으면 길다", () => {
    expect(isLongText("a\nb\nc")).toBe(false);
    expect(isLongText("a\nb\nc\nd")).toBe(true);
    expect(isLongText("가".repeat(91))).toBe(true);
    expect(isLongText("가".repeat(90))).toBe(false);
    expect(isLongText(null)).toBe(false);
  });
});
