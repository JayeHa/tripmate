import { describe, expect, it } from "vitest";

import { fileInfo, voucherDateText } from "./voucher-detail";

describe("fileInfo", () => {
  it("PDF 는 현장용 페이지, 사진은 「이미지」, 원본이 없으면 null", () => {
    expect(fileInfo({ file_key: "k", file_mime: "application/pdf", pages: "1, 3" })).toBe(
      "PDF · 현장용 1, 3페이지",
    );
    expect(fileInfo({ file_key: "k", file_mime: "image/png", pages: "1" })).toBe("이미지");
    expect(fileInfo({ file_key: null, file_mime: null, pages: "1" })).toBeNull();
  });
});

describe("voucherDateText", () => {
  it("여행 안의 날은 「day N · M.D」, 기간 밖 사용일은 그 날짜, 없으면 null", () => {
    expect(voucherDateText({ use_date: null }, 1, "2026-10-20")).toBe("day 2 · 10.21");
    expect(voucherDateText({ use_date: "2026-11-02" }, null, "2026-10-20")).toBe("2026.11.02");
    expect(voucherDateText({ use_date: null }, null, "2026-10-20")).toBeNull();
  });
});
