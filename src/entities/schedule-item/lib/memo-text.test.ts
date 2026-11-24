import { describe, expect, it } from "vitest";

import { memoParts } from "./memo-text";

describe("memoParts", () => {
  it("첫 줄은 제목, 나머지는 본문", () => {
    expect(memoParts("예약번호 TK-2231\n입장 13:30\n신분증 필요")).toEqual({
      starred: false,
      title: "예약번호 TK-2231",
      body: "입장 13:30\n신분증 필요",
    });
  });

  it("한 줄이면 본문이 없다", () => {
    expect(memoParts("우산 챙기기")).toEqual({ starred: false, title: "우산 챙기기", body: "" });
  });

  it("「★ 」 앞머리는 중요 표시로 떼어 낸다", () => {
    expect(memoParts("★ 현금만 받아요\n\n")).toEqual({
      starred: true,
      title: "현금만 받아요",
      body: "",
    });
  });
});
