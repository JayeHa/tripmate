import { describe, expect, it } from "vitest";

import { missingText } from "./missing";

describe("missingText", () => {
  it("빈 필수 칸을 순서대로 잇고 마지막 말에 조사를 맞춘다", () => {
    expect(missingText({ amount: 0, name: "", category: null })).toBe(
      "금액 · 항목명 · 카테고리를 입력해 주세요",
    );
    expect(missingText({ amount: 0, name: "라멘", category: "food" })).toBe("금액을 입력해 주세요");
    expect(missingText({ amount: 10, name: " ", category: "food" })).toBe("항목명을 입력해 주세요");
  });

  it("다 찼으면 빈 글", () => {
    expect(missingText({ amount: 10, name: "라멘", category: "food" })).toBe("");
  });
});
