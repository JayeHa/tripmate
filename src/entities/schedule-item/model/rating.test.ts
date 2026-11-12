import { describe, expect, it } from "vitest";

import {
  nextStars,
  placeKeyOf,
  type PlaceRating,
  ratingText,
  starsOf,
  visitCountsOf,
} from "./rating";
import type { ScheduleItem } from "./types";

/** 별점 한 줄 */
function rating(place_key: string, user_id: string, stars: number): PlaceRating {
  return { place_key, user_id, stars, trip_id: "t", rated_at: "2027-12-05T10:00:00Z" };
}

/** 일정 하나 — 장소 행 id · 구글 장소 ID(없으면 null). place 가 null 이면 항공편 · 노트 */
function item(id: string, place: { id: string; google: string | null } | null) {
  return {
    id,
    place: place && ({ id: place.id, google_place_id: place.google } as ScheduleItem["place"]),
  };
}

const items = [
  item("hotel-am", { id: "p-hotel", google: "g-hotel" }),
  // 일행이 따로 만든 장소 행이라도 구글 장소 ID 가 같으면 같은 장소
  item("hotel-pm", { id: "p-hotel-copy", google: "g-hotel" }),
  item("diner", { id: "p-diner", google: null }),
  item("flight", null),
];

describe("placeKeyOf", () => {
  it("구글 장소 ID, 없으면 장소 행 id, 장소가 없으면 null", () => {
    expect(items.map(placeKeyOf)).toEqual(["g-hotel", "g-hotel", "p-diner", null]);
  });
});

describe("starsOf", () => {
  it("그 사람이 매긴 별점을 일정 id 별로 — 같은 장소의 일정은 모두 같은 값", () => {
    const rows = [
      rating("g-hotel", "me", 4),
      rating("g-hotel", "friend", 2),
      rating("p-diner", "me", 5),
    ];
    expect(starsOf(rows, "me", items)).toEqual({ "hotel-am": 4, "hotel-pm": 4, diner: 5 });
  });

  it("사람을 모르면 빈 값", () => {
    expect(starsOf([rating("g-hotel", "me", 4)], null, items)).toEqual({});
  });
});

describe("visitCountsOf", () => {
  it("장소 일정마다 그 장소를 이 여행에서 들르는 횟수", () => {
    expect(visitCountsOf(items)).toEqual({ "hotel-am": 2, "hotel-pm": 2, diner: 1 });
  });
});

describe("nextStars", () => {
  it("다른 점수를 누르면 그 점수, 같은 점수를 다시 누르면 0(지우기)", () => {
    expect(nextStars(0, 3)).toBe(3);
    expect(nextStars(3, 5)).toBe(5);
    expect(nextStars(4, 4)).toBe(0);
  });
});

describe("ratingText", () => {
  it("1~5 는 문구, 0 은 null", () => {
    expect(ratingText(1)).toBe("별로예요");
    expect(ratingText(5)).toBe("최고예요");
    expect(ratingText(0)).toBeNull();
  });
});
