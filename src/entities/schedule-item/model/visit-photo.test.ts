import { describe, expect, it } from "vitest";

import { photosByItem, type VisitPhoto, visitVideoOf } from "./visit-photo";

/** 테스트용 사진 줄 */
function photo(
  id: string,
  item: string,
  user: string,
  position: number,
  at = "2027-01-01",
): VisitPhoto {
  return {
    id,
    item_id: item,
    trip_id: "t",
    user_id: user,
    photo_key: `t/${id}.jpg`,
    thumb_key: `t/${id}-t.jpg`,
    caption: null,
    position,
    created_at: at,
    video_key: null,
    duration: null,
    poster_at: null,
  };
}

describe("photosByItem", () => {
  it("일행이 올린 것까지 일정별로, 순서 → 올린 순", () => {
    const rows = [
      photo("c", "i1", "me", 1),
      photo("a", "i1", "me", 0, "2027-01-02"),
      photo("b", "i1", "other", 0, "2027-01-01"),
      photo("d", "i2", "me", 5),
    ];
    const got = photosByItem(rows);
    expect(got.i1.map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(got.i2.map((p) => p.id)).toEqual(["d"]);
  });

  it("사진이 없으면 빈 값", () => {
    expect(photosByItem([])).toEqual({});
  });
});

describe("visitVideoOf", () => {
  it("영상 줄이면 원본 키 · 길이 · 표지 지점, 사진 줄이면 null", () => {
    expect(visitVideoOf(photo("a", "i", "me", 0))).toBeNull();
    const video = {
      ...photo("b", "i", "me", 1),
      video_key: "t/b.mp4",
      duration: 12.4,
      poster_at: 1,
    };
    expect(visitVideoOf(video)).toEqual({ key: "t/b.mp4", duration: 12.4, posterAt: 1 });
  });
});
