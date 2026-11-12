import { describe, expect, it } from "vitest";

import { cleanCaption, visitPhotoKey, visitPhotoKeysInTrip } from "./visit-photo-rules";

describe("visitPhotoKey", () => {
  it("여행 폴더 아래 uuid · 확장자, 모르는 종류는 jpg", () => {
    expect(visitPhotoKey("t", "u", "image/png")).toBe("t/u.png");
    expect(visitPhotoKey("t", "u", "image/heic")).toBe("t/u.jpg");
  });
});

describe("visitPhotoKeysInTrip", () => {
  it("그 여행 폴더 안의 키만", () => {
    expect(visitPhotoKeysInTrip("t", ["t/a.jpg", "t/b.jpg"])).toBe(true);
    expect(visitPhotoKeysInTrip("t", ["t/a.jpg", "x/b.jpg"])).toBe(false);
    expect(visitPhotoKeysInTrip("t", ["t/../x/b.jpg"])).toBe(false);
  });
});

describe("cleanCaption", () => {
  it("앞뒤 공백을 떼고, 비면 null", () => {
    expect(cleanCaption("  입구 ")).toBe("입구");
    expect(cleanCaption("   ")).toBeNull();
  });
});
