import { describe, expect, it } from "vitest";

import { isPackPhotoMime, packPhotoKey, packPhotoKeysInTrip, photoOf } from "./photo-rules";

describe("쇼핑 사진 규칙", () => {
  it("줄인 사진 종류만 — HEIC · PDF 는 받지 않는다", () => {
    expect(isPackPhotoMime("image/jpeg")).toBe(true);
    expect(isPackPhotoMime("image/webp")).toBe(true);
    expect(isPackPhotoMime("image/heic")).toBe(false);
    expect(isPackPhotoMime("application/pdf")).toBe(false);
  });

  it("키는 여행 폴더 안 — 다른 여행 · `..` 은 막는다", () => {
    expect(packPhotoKey("t1", "u1", "image/png")).toBe("t1/u1.png");
    expect(packPhotoKeysInTrip("t1", ["t1/a.jpg", "t1/b.jpg"])).toBe(true);
    expect(packPhotoKeysInTrip("t1", ["t2/a.jpg"])).toBe(false);
    expect(packPhotoKeysInTrip("t1", ["t1/../t2/a.jpg"])).toBe(false);
  });

  it("항목의 사진 — 두 칸이 다 있을 때만", () => {
    expect(photoOf({ photo_key: "t/p.jpg", thumb_key: "t/t.jpg" })).toEqual({
      photo_key: "t/p.jpg",
      thumb_key: "t/t.jpg",
    });
    expect(photoOf({ photo_key: null, thumb_key: null })).toBeNull();
    expect(photoOf({})).toBeNull();
  });
});
