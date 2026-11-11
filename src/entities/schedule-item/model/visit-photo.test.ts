import { describe, expect, it } from "vitest";

import { photosByItem, type VisitPhoto } from "./visit-photo";

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
  };
}

describe("photosByItem", () => {
  it("내 사진만 일정별로, 순서 → 올린 순", () => {
    const rows = [
      photo("c", "i1", "me", 1),
      photo("a", "i1", "me", 0, "2027-01-02"),
      photo("b", "i1", "me", 0, "2027-01-01"),
      photo("x", "i1", "other", 0),
      photo("d", "i2", "me", 5),
    ];
    const got = photosByItem(rows, "me");
    expect(got.i1.map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(got.i2.map((p) => p.id)).toEqual(["d"]);
  });

  it("사람을 모르면 빈 값", () => {
    expect(photosByItem([photo("a", "i", "me", 0)], null)).toEqual({});
  });
});
