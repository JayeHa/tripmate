import { describe, expect, it } from "vitest";

import { isReceiptMime, keysInTrip, receiptKey } from "./receipt-rules";

describe("receipt-rules", () => {
  it("사진 · PDF 만 받는다", () => {
    expect(isReceiptMime("image/heic")).toBe(true);
    expect(isReceiptMime("application/pdf")).toBe(true);
    expect(isReceiptMime("image/gif")).toBe(false);
  });

  it("키는 여행 폴더 아래 · 종류에 맞는 확장자", () => {
    expect(receiptKey("t1", "u1", "image/jpeg")).toBe("t1/u1.jpg");
    expect(receiptKey("t1", "u1", "application/pdf")).toBe("t1/u1.pdf");
  });

  it("그 여행 폴더 밖이나 상위 경로가 섞이면 거부", () => {
    expect(keysInTrip("t1", ["t1/a.jpg", "t1/b.pdf"])).toBe(true);
    expect(keysInTrip("t1", ["t2/a.jpg"])).toBe(false);
    expect(keysInTrip("t1", ["t1/../t2/a.jpg"])).toBe(false);
  });
});
