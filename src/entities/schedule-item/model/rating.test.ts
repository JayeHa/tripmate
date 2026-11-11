import { describe, expect, it } from "vitest";

import { nextStars, type PlaceRating, ratingText, starsOf } from "./rating";

/** 별점 한 줄 */
function rating(item_id: string, user_id: string, stars: number): PlaceRating {
  return { item_id, user_id, stars, trip_id: "t", rated_at: "2027-12-05T10:00:00Z" };
}

describe("starsOf", () => {
  it("그 사람이 매긴 별점만 일정 id 별로 모은다", () => {
    const rows = [rating("a", "me", 4), rating("a", "friend", 2), rating("b", "me", 5)];
    expect(starsOf(rows, "me")).toEqual({ a: 4, b: 5 });
  });

  it("사람을 모르면 빈 값", () => {
    expect(starsOf([rating("a", "me", 4)], null)).toEqual({});
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
