import { describe, expect, it } from "vitest";

import type { TaxRefundPhoto } from "../model/types";
import { photoKindLabel, photosOf, refundPhotoKey, refundPhotoKeysInTrip } from "./photo-rules";

/** 테스트용 사진 한 장 */
function photo(id: string, kind: string, created_at: string, refund_id = "r"): TaxRefundPhoto {
  return {
    id,
    trip_id: "t",
    refund_id,
    kind,
    photo_key: `t/${id}.jpg`,
    thumb_key: `t/${id}-t.jpg`,
    created_by: null,
    created_at,
  };
}

describe("환급 사진 규칙", () => {
  it("키는 여행 폴더, 폴더 밖 · .. 은 거부", () => {
    expect(refundPhotoKey("t", "u", "image/png")).toBe("t/u.png");
    expect(refundPhotoKeysInTrip("t", ["t/a.jpg"])).toBe(true);
    expect(refundPhotoKeysInTrip("t", ["x/a.jpg"])).toBe(false);
    expect(refundPhotoKeysInTrip("t", ["t/../x.jpg"])).toBe(false);
  });

  it("기록의 사진은 종류 순(영수증 → 물품 → 캡처), 같은 종류는 올린 순", () => {
    const list = [
      photo("c", "capture", "1"),
      photo("r2", "receipt", "3"),
      photo("r1", "receipt", "2"),
      photo("i", "item", "4"),
      photo("x", "receipt", "0", "other"),
    ];
    expect(photosOf(list, "r").map((p) => p.id)).toEqual(["r1", "r2", "i", "c"]);
    expect(photoKindLabel("capture")).toBe("캡처");
    expect(photoKindLabel("qr")).toBe("사진");
  });
});
